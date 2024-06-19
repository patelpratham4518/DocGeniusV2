public with sharing class GoogleDocPreview {
    public GoogleDocPreview() {

    }
    @AuraEnabled
    public static void doPreview(String googleDocId,String recordId,String objectApiName){
        try {
            googleDocId = '1S_sDW_CDgnPYfIlmqOWhkkyDv_E5YThJPT3-UdWr7Do';
            recordId = '001H4000008UpuCIAS';
            objectApiName = 'Account';
            Attachment attachment = new Attachment(Name='Google.pdf',ParentId='003H4000006wabAIAQ',Body=Blob.valueOf('NULL'),ContentType='application/pdf');

            String newGoogleDocId = copyGoogleDoc(googleDocId);
            try {
                String sourceDocContent = getDocument(newGoogleDocId);

                String modiFiedDocContent = sourceDocContent;
                modiFiedDocContent = KeyMappingController.mappingObjFieldsData(modiFiedDocContent, recordId, objectApiName);
                modiFiedDocContent = KeyMappingController.mappingGeneralFieldData(modiFiedDocContent);
                modiFiedDocContent = KeyMappingController.mappingMergeTemplate(modiFiedDocContent);
                
                List<Object> bodyContentOriginal = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
                List<Object> bodyContentNew = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(modiFiedDocContent)).get('body')))).get('content');
                
                List<Object> requests = formatContentForBatchUpdate(bodyContentNew,bodyContentOriginal);
                updateGoogleDoc(newGoogleDocId, requests);

                attachment.Body = getPDF(newGoogleDocId);
            } catch (Exception e) {
                System.debug('Error In doPreview while between copy and delete ==> '+e.getMessage());
                Log_Handler.store_Exception(e,'GoogleDocPreview','doPreview');
            } finally {
                deleteGoogleDoc(newGoogleDocId);
            }
            
            insert attachment;

        } catch (Exception e) {
            System.debug('Error In doPreview ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','doPreview');
        }
    }

    private static HttpResponse refreshAccessToken(AuthProviderSettings__c settings,HttpRequest requestPending) {
        try {
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
        } catch (Exception e) {
            System.debug('Error In refreshAccessToken ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','refreshAccessToken');
            return null;
        }

    }

    public static String getDocument(String googleDocId) {
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents/'+googleDocId;
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('GET');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            Http http = new Http();
            HttpResponse response = http.send(request);
            // System.debug('Response ==>'+response.getBody());
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
                // System.debug('Response ==>'+response.getBody());
                 return response.getBody();
             }
             return null;
            } catch (Exception e) {
                System.debug('Error In getDocument ==> '+e.getMessage());
                Log_Handler.store_Exception(e,'GoogleDocPreview','getDocument');
                return null;
        }
    }

    public static String copyGoogleDoc(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId+'/copy';
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();

            Map<String, Object> requestBody = new Map<String, Object>();
            requestBody.put('name', 'CopyOf'+googleDocId);
            String jsonBody = JSON.serialize(requestBody);
            HttpRequest request = new HttpRequest();

            request.setEndpoint(endpoint);
            request.setMethod('POST');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            request.setHeader('Content-Type', 'application/json');
            request.setBody(jsonBody);

            Http http = new Http();
            HttpResponse response = http.send(request);

            if (response.getStatusCode() == 200) {
                // System.debug('Response of copy doc==>'+response);
                // System.debug('Response body copy=>'+response.getBody());
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                return String.valueOf(responseMap.get('id'));
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
                // System.debug('Response of copy doc==>'+response);
                // System.debug('Response body copy=>'+response.getBody());
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                return String.valueOf(responseMap.get('id'));
             }
             return null;


        } catch (Exception e) {
            System.debug('Error In copyGoogleDoc ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','copyGoogleDoc');
            return null;
        }
    }

    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContentNew, List<Object> bodyContentOriginal) {
        try {
            List<Object> requests = new List<Object>();
            List<Object> tableRequests = new List<Object>();
        
            Integer originalIndex = 0;
        
            for (Object newElement : bodyContentNew) {
                Map<String, Object> newElementMap = (Map<String, Object>) newElement;
                Map<String, Object> originalElementMap = (Map<String, Object>) bodyContentOriginal[originalIndex];
        
                if (newElementMap.containsKey('paragraph') && originalElementMap.containsKey('paragraph')) {
                    Map<String, Object> newParagraph = (Map<String, Object>) newElementMap.get('paragraph');
                    Map<String, Object> originalParagraph = (Map<String, Object>) originalElementMap.get('paragraph');
                    List<Object> newElements = (List<Object>) newParagraph.get('elements');
                    List<Object> originalElements = (List<Object>) originalParagraph.get('elements');
        
                    for (Integer i = 0; i < newElements.size(); i++) {
                        Map<String, Object> newElMap = (Map<String, Object>) newElements[i];
                        Map<String, Object> originalElMap = (Map<String, Object>) originalElements[i];
        
                        if (newElMap.containsKey('textRun') && originalElMap.containsKey('textRun')) {
                            Map<String, Object> newTextRun = (Map<String, Object>) newElMap.get('textRun');
                            Map<String, Object> originalTextRun = (Map<String, Object>) originalElMap.get('textRun');
        
                            if (newTextRun != null && originalTextRun != null) {
                                String newText = (String) newTextRun.get('content');
                                String originalText = (String) originalTextRun.get('content');
                                Map<String, Object> textStyle = (Map<String, Object>) newTextRun.get('textStyle');
        
                                // Create a replaceAllText request to replace the text
                                Map<String, Object> replaceAllTextRequest = new Map<String, Object>{
                                    'replaceAllText' => new Map<String, Object>{
                                        'containsText' => new Map<String, Object>{
                                            'text' => originalText,
                                            'matchCase' => true
                                        },
                                        'replaceText' => newText
                                    }
                                };
        
                                requests.add(replaceAllTextRequest);
                            }
                        }
                    }
                } else if (newElementMap.containsKey('table') && originalElementMap.containsKey('table')) {
                    // Logic for table
                    Map<String, Object> newTable = (Map<String, Object>) newElementMap.get('table');
                    Map<String, Object> originalTable = (Map<String, Object>) originalElementMap.get('table');
                  
                    Integer tableStartLocation = (Integer) originalElementMap.get('startIndex');
                    System.debug('tableStartLocation=>'+tableStartLocation);
                    List<Object> originalTableRows = (List<Object>) originalTable.get('tableRows');
                    List<Object> newTableRows = (List<Object>) newTable.get('tableRows');
        
                    // Assuming we want to clone the first row
                    Map<String, Object> firstRow = (Map<String, Object>) originalTableRows[0];
                    // System.debug('End of first row=>'+firstRow.get('endIndex'));
                    
        
                    //Insert empty rows equal to number of records
                    Integer numberOfRecords = 5;
                    for (Integer i = 1; i <= numberOfRecords; i++) {
                        
                        Map<String, Object> insertTableRowRequest = new Map<String, Object>{
                            'insertTableRow' => new Map<String, Object>{
                                'tableCellLocation' => new Map<String, Object>{
                                    'tableStartLocation' => new Map<String, Object>{
                                        'segmentId' => '',
                                        'index' => tableStartLocation
                                    },
                                    'rowIndex' => i, // The row index where the new row will be inserted (0-based index)
                                    'columnIndex' => 0 // This is required but can be 0 for row insertion
                                },
                                'insertBelow' => true
                            }
                        };
                        tableRequests.add(insertTableRowRequest);
                    }

                    //Delete first row containing keys
                    Map<String,Object> deleteTableRowRequest = new Map<String,Object>{
                        'deleteTableRow' => new Map<String,Object>{
                            'tableCellLocation' => new Map<String, Object>{
                                'tableStartLocation' => new Map<String, Object>{
                                    'segmentId' => '',
                                    'index' => tableStartLocation
                                },
                                'rowIndex' => 1, // The row index where the new row will be inserted (0-based index)
                                'columnIndex' => 0 // This is required but can be 0 for row insertion
                            }
                        }
                    };
                    tableRequests.add(deleteTableRowRequest);

                    // End table
                }
        
                originalIndex++;
            }
        
            requests.addAll(tableRequests);
            return requests;
        } catch (Exception e) {
            System.debug('Error In formatContentForBatchUpdate ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','formatContentForBatchUpdate');
            return null;
        }

    }

    public static void updateGoogleDoc(String googleDocId,List<Object> requests) {
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents/'+googleDocId+'/:batchUpdate';
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
            Map<Object, Object> requestBody = new Map<Object, Object>();
            requestBody.put('requests', requests);   
            String jsonBody = JSON.serialize(requestBody);
            
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('POST');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            request.setHeader('Content-Type', 'application/json');
            request.setBody(jsonBody);
    
            Http http = new Http();
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                //do nothing
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
             }
            
            System.debug('Response of update doc ==>'+response);
            System.debug('Response body of update doc ==>'+response.getBody());
        } catch (Exception e) {
            System.debug('Error In updateDoc ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','updateGoogleDoc');
        }
 
    }

    public static Blob getPDF(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId+'/export';
        AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();

        Map<String, String> params = new Map<String, String>();
        params.put('mimeType','application/pdf');
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
        System.debug('Response=>'+response);
        System.debug('Body of pdf=>'+response.getBody());
        if (response.getStatusCode() == 200) {      
            return response.getBodyAsBlob();
        } else if (response.getStatusCode() == 401) {
            System.debug('Here is some error 401');
            response = refreshAccessToken(authProvider,request);
            return response.getBodyAsBlob();
        }
        return null;
        } catch (Exception e) {
            System.debug('Error In updateDoc ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','getPDF');
            return null;
        }
        
    }

    public static void deleteGoogleDoc(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId;
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
    
            Map<String, String> params = new Map<String, String>();
            
            String paramString = '';
    
            for (String key : params.keySet()) {
                if (!String.isEmpty(paramString)) {
                    paramString += '&';
                }
                paramString += EncodingUtil.urlEncode(key, 'UTF-8') + '=' + EncodingUtil.urlEncode(params.get(key), 'UTF-8');
            }
    
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint + '?'+paramString);
            request.setMethod('DELETE');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            Http http = new Http();
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 204) {      
               //document deleted
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
            }
            System.debug('Response of delete google doc=>'+response);
            System.debug('ResponseBody of delete google doc=>'+response.getBody());
        } catch (Exception e) {
            System.debug('Error In deleteGoogleDoc ==> '+e.getMessage());
            Log_Handler.store_Exception(e,'GoogleDocPreview','deleteGoogleDoc');
        }

    }
    
}