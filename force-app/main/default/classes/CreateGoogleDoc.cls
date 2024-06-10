public with sharing class CreateGoogleDoc {
    public CreateGoogleDoc() {

    }

    public static string getDocument(String id) {
        
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents/'+id;
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('GET');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            Http http = new Http();
            HttpResponse response = http.send(request);
            // System.debug('Response ==>'+response.getBody());
            return response.getBody();
        } catch (Exception e) {
            System.debug('Error In get Docs ==> '+e.getMessage());
            return null;
        }
    }

    public static string modifyContent(String originalContent,String placeholder,String newValue){
        return originalContent.replace(placeholder,newValue);
    }

    public static void createNewDoc(String title) {
        System.debug('Create new doc');
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents';
            AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
            Map<String, Object> requestBody = new Map<String, Object>();

            requestBody.put('title', title);

            String jsonBody = JSON.serialize(requestBody);
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('POST');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            request.setHeader('Content-Type', 'application/json');
            request.setBody(jsonBody);

            Http http = new Http();
            HttpResponse response = http.send(request);
            System.debug('Response ==>'+response);
            System.debug('Response body=>'+response.getBody());

        }
        catch(Exception e){
            System.debug('Error in create doc ==> '+e.getMessage());
        }
    }

    public static void updateDoc(String documentId, String modifiedContent,List<Object> requests) {
    // public static void updateDoc(String documentId, String modifiedContent) {
        // 17-VWzwbL79v7iYi3lXFS3lDeHFS62EVrpJXb49i9ZfE
        //CreateGoogleDoc.updateDoc('17-VWzwbL79v7iYi3lXFS3lDeHFS62EVrpJXb49i9ZfE',modiFiedContent);

        String endpoint = 'https://docs.googleapis.com/v1/documents/'+documentId+'/:batchUpdate';
        AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();

        
       
        Map<Object, Object> requestBody = new Map<Object, Object>();
        
        // List<Object> requests = new List<Object>();
        // requests.add(new Map<String, Object>{
        //     'insertText' => new Map<String, Object>{
        //         'location' => new Map<String, Object>{
        //             'index' => 1
        //         },
        //         'text' => modifiedContent
        //     }
        // });
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
        System.debug('Response ==>'+response);
        System.debug('Response body=>'+response.getBody());
    }

    public static void main() {
        String sourceDocContent = getDocument('1Dga4sbG65SM8dDbEiA3yRfvTeGXmafOlb2J9B_Goy2Q');

        List<Object> body = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
        // List<Object> body = (List<Object>) sourceDocContent.get('body').get('content');
        List<Object> requests = formatContentForBatchUpdate(body);
        CreateGoogleDoc.updateDoc('17-VWzwbL79v7iYi3lXFS3lDeHFS62EVrpJXb49i9ZfE',sourceDocContent,requests);
    }

    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContent) {
        List<Object> requests = new List<Object>();
        Integer currentIndex = 1;

        for (Object element : bodyContent) {
            Map<String, Object> elementMap = (Map<String, Object>) element;

            if (elementMap.containsKey('paragraph')) {
                Map<String, Object> paragraph = (Map<String, Object>) elementMap.get('paragraph');
                List<Object> elements = (List<Object>) paragraph.get('elements');

                for (Object el : elements) {
                    Map<String, Object> elMap = (Map<String, Object>) el;
                    if (elMap.containsKey('textRun')) {
                        Map<String, Object> textRun = (Map<String, Object>) elMap.get('textRun');
                        if (textRun != null) {
                            String text = (String) textRun.get('content');
                            Map<String, Object> textStyle = (Map<String, Object>) textRun.get('textStyle');

                            Map<String, Object> insertTextRequest = new Map<String, Object>{
                                'insertText' => new Map<String, Object>{
                                    'location' => new Map<String, Object>{
                                        'index' => currentIndex
                                    },
                                    'text' => text
                                }
                            };

                            requests.add(insertTextRequest);

                            if (textStyle != null) {
                                Map<String, Object> updateTextStyleRequest = new Map<String, Object>{
                                    'updateTextStyle' => new Map<String, Object>{
                                        'range' => new Map<String, Object>{
                                            'startIndex' => currentIndex,
                                            'endIndex' => currentIndex + text.length()
                                        },
                                        'textStyle' => textStyle,
                                        'fields' => '*'
                                    }
                                };

                                requests.add(updateTextStyleRequest);
                            }

                            currentIndex += text.length();
                        }
                    }
                }
            }
        }

        return requests;
    }


}