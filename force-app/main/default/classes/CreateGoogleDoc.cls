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
            System.debug('Response ==>'+response.getBody());
            return response.getBody();
        } catch (Exception e) {
            System.debug('Error In get Docs ==> '+e.getMessage());
            return null;
        }
    }

    public static Attachment getPDF(String googleDocId) {
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
            Attachment attachment = new Attachment(Name='Google.pdf',ParentId='003H4000006wabAIAQ',Body=response.getBodyAsBlob(),ContentType='application/pdf');
            // insert attachment;
            return attachment;
        } 
        return null;
    }

    public static void deleteDoc(String googleDocId) {
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
        System.debug('Response=>'+response);
        System.debug('Body=>'+response.getBody());
        
    }


    public static string copy(String googleDocId) {
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
            System.debug('Response of copy doc==>'+response);
            System.debug('Response body copy=>'+response.getBody());
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
            return String.valueOf(responseMap.get('id'));
        }
        catch(Exception e){
            System.debug('Error in copy doc ==> '+e.getMessage());
            return null;
        }
    }
    public static void updateDoc(String documentId,List<Object> requests) {
 
        String endpoint = 'https://docs.googleapis.com/v1/documents/'+documentId+'/:batchUpdate';
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
        System.debug('Response ==>'+response);
        System.debug('Response body=>'+response.getBody());
    }

    public static void main2() {
        String newDocId = copy('1Dga4sbG65SM8dDbEiA3yRfvTeGXmafOlb2J9B_Goy2Q');
        String sourceDocContent = getDocument(newDocId);
        String modifiedHTML = sourceDocContent;
        modifiedHTML = KeyMappingController.mappingObjFieldsData(modifiedHTML, '001H4000008UpuCIAS', 'Account');
        modifiedHTML = KeyMappingController.mappingGeneralFieldData(modifiedHTML);
        modifiedHTML = KeyMappingController.mappingMergeTemplate(modifiedHTML);
        
         
        List<Object> bodyContentNew = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(modifiedHTML)).get('body')))).get('content');
        List<Object> bodyContentOriginal = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
      
        List<Object> requests = formatContentForBatchUpdate(bodyContentNew,bodyContentOriginal);
        
        CreateGoogleDoc.updateDoc(newDocId,requests);

        Attachment attachment = getPDF(newDocId);
        deleteDoc(newDocId);
        insert attachment;
    }

    
        
    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContentNew, List<Object> bodyContentOriginal) {
        List<Object> requests = new List<Object>();
    
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
                            // System.debug('New Text => ' + newText);
                            // System.debug('Original Text => ' + originalText);
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
            }
            
            originalIndex++;
        }
    
        return requests;
    }
    
}