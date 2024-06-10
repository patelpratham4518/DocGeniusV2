public with sharing class GoogleDocTemplateEditorController {
    public GoogleDocTemplateEditorController() {

    }

    @AuraEnabled
    public static String getAllDocs() {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files';
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();

            Map<String, String> params = new Map<String, String>();
            
            params.put('q','(mimeType= "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or mimeType= "application/vnd.google-apps.document") and (trashed=false)');
            params.put('fields','files(id,name,webViewLink,createdTime,modifiedTime,size)');

            String paramString = '';
            for (String key : params.keySet()) {
                if (!String.isEmpty(paramString)) {
                    paramString += '&';
                }
                paramString += EncodingUtil.urlEncode(key, 'UTF-8') + '=' + EncodingUtil.urlEncode(params.get(key), 'UTF-8');
            }

            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint + '?'+paramString);
            request.setMethod('GET');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);

            Http http = new Http();
            HttpResponse response = http.send(request);

            if (response.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                return JSON.serialize(responseMap.get('files'));
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
                if (response.getStatusCode() == 200) {
                    Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                    return JSON.serialize(responseMap.get('files'));
                }
            }
            return null;
           
        } catch (Exception e) {
            System.debug('Error In get all Docs ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','getAllDocs');
            return null;
        }
    }

    private static HttpResponse refreshAccessToken(AuthProviderSettings__c settings,HttpRequest requestPending) {
        System.debug('Refresh Access token');
        String ENDPOINT = 'https://oauth2.googleapis.com/token';
        HttpRequest request = new HttpRequest();
        request.setEndpoint(ENDPOINT);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setBody('refresh_token=' + settings.refresh_token__c +
                        '&client_id=' + settings.ClientId__c +
                        '&client_secret=' + settings.ClientSecret__c +
                        '&grant_type=refresh_token');

        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == 200) {
            Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            String newToken = (String) jsonResponse.get('access_token');
            if (newToken != null) {
                settings.access_token__c = newToken;
                requestPending.setHeader('Authorization','Bearer '+newToken);
                Http httpPending = new Http();
                HttpResponse responsePending = httpPending.send(requestPending);
                upsert settings;
                return responsePending;
            }
        }

        System.debug('Token refresh failed. Status Code: ' + response.getStatusCode());
        System.debug('Response Body: ' + response.getBody());
        return null;
    }
    
    @AuraEnabled
    public static String getTemplateHTML(String id) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+id+'/export';
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();

            Map<String, String> params = new Map<String, String>();
            params.put('mimeType','text/html');
            String paramString = '';

            for (String key : params.keySet()) {
                if (!String.isEmpty(paramString)) {
                    paramString += '&';
                }
                paramString += EncodingUtil.urlEncode(key, 'UTF-8') + '=' + EncodingUtil.urlEncode(params.get(key), 'UTF-8');
            }

            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint + '?'+paramString);
            request.setMethod('GET');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            Http http = new Http();
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
               return JSON.serialize(response.getBody());
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
                return JSON.serialize(response.getBody());
            }
            return null;
    
        } catch (Exception e) {
            System.debug('Error In get HTML of  Docs ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','getTemplateHTML');
            return null;
        }
    }

    @AuraEnabled
    public static String getTemplate(String templateId){
        try {
            String templateName = [SELECT Template_Name__c FROM Template__c WHERE Id=:templateId].Template_Name__c;
            Template_Data__c templateData = [SELECT Google_Doc_WebViewLink__c FROM Template_Data__c WHERE Template__c=:templateId AND Order_No_Simple__c = 1];
            return templateData.Google_Doc_WebViewLink__c;
        } catch (Exception e) {
            System.debug('Error In getTemplate ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','getTemplate');
            return null;
        }
    }


    @AuraEnabled
    public static string getTemplateName(string templateId){
        try {
            String templateName = [SELECT Template_Name__c FROM Template__c WHERE Id=:templateId].Template_Name__c;
            return templateName;
        } catch (Exception e) {
            System.debug('Error In getTemplateName ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','getTemplate');
            return null;   
        }
    }

    @AuraEnabled
    public static string getUsernameAndEmail(){
        try {

            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
            Map<String, String> profile = new Map<String, String>();
            profile.put('username',authProvider.username__c);
            profile.put('email',authProvider.email__c);
            return JSON.serialize(profile);
        } catch (Exception e) {
            return null;
        }
    }

    @AuraEnabled
    public static void saveTemplateData(String templateId,String googleDocId,String webViewLink){
        try {
            Template_Data__c templateData = new Template_Data__c();
            templateData.Google_Doc_Template_Id__c	= googleDocId;
            templateData.Google_Doc_WebViewLink__c = webViewLink;
            templateData.Template__c = templateId;
            templateData.Order_No_Simple__c = 1;
            insert templateData;
        } catch (Exception e) {
            System.debug('Error In saveTemplateData ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','saveTemplateData');
        }
    }

    public static List<Template_Data__c> oldTemplateData;
    public static List<Template_Data__c> newTemplateData;
    @AuraEnabled
    public static string saveHTML(String templateId){
        try {
            oldTemplateData = [SELECT Google_Doc_Template_Id__c,Template__c,Value_Type__c,Order_No_Simple__c FROM Template_Data__c WHERE Template__c=:templateId ORDER BY Order_No_Simple__c];
            newTemplateData = new List<Template_Data__c>();
            newTemplateData.add(oldTemplateData[0]);
            oldTemplateData.remove(0);

            // Template_Data__c templateData = [SELECT Google_Doc_Template_Id__c,Template__c,Value_Type__c,Order_No_Simple__c FROM Template_Data__c WHERE Template__c=:templateId AND Order_No_Simple__c = 1];
            String html = getTemplateHTML(newTemplateData[0].Google_Doc_Template_Id__c);
            System.debug('HTML ==>'+html);
            System.debug('HTML Size total ==> '+html.length());
            divideAndSaveHTML(html,1);
            return 'success';
        } catch (Exception e) {
            System.debug('Error In saveHTML ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','saveHTML');
            return 'fail';
        }
    }


    public static void divideAndSaveHTML(String html,Integer orderNo) {
        try {
            Template_Data__c templateData = newTemplateData[newTemplateData.size()-1];
            if (html.length() < 130000) {
                templateData.Template_Value_Simple__c = html;
                templateData.Order_No_Simple__c = orderNo;
                templateData.Value_Type__c = 'Body Value';
                upsert newTemplateData;
                delete oldTemplateData;
            } else {
                String leftHTML  = html.substring(130000,html.length());
                if (oldTemplateData.isEmpty()) {
                    newTemplateData.add(new Template_Data__c(Template__c=templateData.Template__c));
                
                } else {
                    newTemplateData.add(oldTemplateData[0]);
                    oldTemplateData.remove(0);
                }
                
                html = html.substring(0,130000);
                templateData.Template_Value_Simple__c = html;
                templateData.Order_No_Simple__c = orderNo;
                templateData.Value_Type__c = 'Body Value';
                
                divideAndSaveHTML(leftHTML,orderNo+1);
            }
        } catch (Exception e) {
            System.debug('Error In divideAndSaveHTML ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','divideAndSaveHTML');
        }
       
    }

    public static void deleteRestTemplateData(Template_Data__c templateData){
        List<Template_Data__c> restTemplatDatas = [SELECT Id,Template__c,Order_No_Simple__c FROM Template_Data__c WHERE Template__c=:templateData.Template__c AND Order_No_Simple__c>:templateData.Order_No_Simple__c];
        delete restTemplatDatas;
    }

    @AuraEnabled
    public static string getLabel(String objectName){
        try {
            Map<String, Schema.SObjectType> sObjectMap = Schema.getGlobalDescribe(); 
            string objLabel = sObjectMap.get(objectName).getDescribe().getLabel();
            return objLabel;
        } catch (Exception e) {
            System.debug('Error In getLabel ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDriveTemplatesController','getLabel');
            return null;
        }
    }

    


}