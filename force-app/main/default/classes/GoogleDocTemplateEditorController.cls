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
    public static string getTemplate(String id){
        try {
            Template_Data__c templateData = [SELECT Google_Doc_WebViewLink__c FROM Template_Data__c WHERE Template__c=:id];
            return templateData.Google_Doc_WebViewLink__c;
        } catch (Exception e) {
            System.debug('Error In getTemplate ==> '+e.getMessage());
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


}