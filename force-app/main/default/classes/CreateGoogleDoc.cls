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
        // String newDocId = copy('16orWcm4A2sQRwMBhUt1n0m02bPbBfj5HltmxtEkCFdA');
        String newDocId = '1S_sDW_CDgnPYfIlmqOWhkkyDv_E5YThJPT3-UdWr7Do';
        String sourceDocContent = getDocument(newDocId);

        String modifiedHTML = sourceDocContent;
        modifiedHTML = KeyMappingController.mappingObjFieldsData(modifiedHTML, '001H4000008UpuCIAS', 'Account');
        modifiedHTML = KeyMappingController.mappingGeneralFieldData(modifiedHTML);
        modifiedHTML = KeyMappingController.mappingMergeTemplate(modifiedHTML);
        
         
        List<Object> bodyContentNew = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(modifiedHTML)).get('body')))).get('content');
        List<Object> bodyContentOriginal = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
        
        List<Object> requests = formatContentForBatchUpdate(bodyContentNew,bodyContentOriginal);
        CreateGoogleDoc.updateDoc(newDocId,requests);
        
        // List<Object> requests = insertTabletext(bodyContentOriginal);
        sourceDocContent = getDocument(newDocId);
        bodyContentOriginal = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
        requests = insertTabletext(bodyContentOriginal);
        CreateGoogleDoc.updateDoc(newDocId,requests);
        

        // Attachment attachment = getPDF(newDocId);
        // deleteDoc(newDocId);
        // insert attachment;
    }

    
        
  

    
    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContentNew, List<Object> bodyContentOriginal) {
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
                
    
                // Prepare a request to insert a new row below the first row
                Map<String, Object> insertTableRowRequest = new Map<String, Object>{
                    'insertTableRow' => new Map<String, Object>{
                        'tableCellLocation' => new Map<String, Object>{
                            'tableStartLocation' => new Map<String, Object>{
                                'segmentId' => '',
                                'index' => tableStartLocation
                            },
                            'rowIndex' => originalTableRows.size()-2, // The row index where the new row will be inserted (0-based index)
                            // 'rowIndex' => 1, // The row index where the new row will be inserted (0-based index)
                            'columnIndex' => 0 // This is required but can be 0 for row insertion
                        },
                        'insertBelow' => true
                    }
                };
                tableRequests.add(insertTableRowRequest);
                // End table
            }
    
            originalIndex++;
        }
    
        requests.addAll(tableRequests);
        return requests;
    }


    
    public static List<Object> insertTabletext(List<Object> bodyContentOriginal) {
        System.debug('Insert text in table');
        List<Object> requests = new List<Object>();
    
        for (Object originalElement : bodyContentOriginal) {
            Map<String, Object> originalElementMap = (Map<String, Object>) originalElement;
            if (originalElementMap.containsKey('table')) {
                Map<String, Object> originalTable = (Map<String, Object>) originalElementMap.get('table');
                Integer tableStartLocation = (Integer) originalElementMap.get('startIndex');
                List<Object> originalTableRows = (List<Object>) originalTable.get('tableRows');
                // Map<String, Object> thirdRow = (Map<String, Object>) originalTableRows[2];
                // List<Object> tableCells = (List<Object>) thirdRow.get('tableCells');
                // Map<String, Object> row = (Map<String, Object>) originalTableRows[originalTableRows.size() -2];
                Map<String, Object> row = (Map<String, Object>) originalTableRows[originalTableRows.size() -2];
                List<Object> tableCells = (List<Object>) row.get('tableCells');
    
                // Adjusting for the insertion index
                Integer insertionOffset = 0;
                for (Object tableCell : tableCells) {
                    Map<String, Object> tableCellMap = (Map<String, Object>) tableCell;
                    Integer tableCellStartIndex = (Integer) tableCellMap.get('startIndex') + insertionOffset;
    
                    // Create the insertText request
                    Map<String, Object> insertTextRequest = new Map<String, Object>{
                        'insertText' => new Map<String, Object>{
                            'text' => 'Pratham',
                            'location' => new Map<String, Object>{
                                'segmentId' => '',
                                'index' => tableCellStartIndex + 1
                            }
                        }
                    };
    
                    requests.add(insertTextRequest);
    
                    // Update the insertion offset
                    insertionOffset += 'Pratham'.length();
                }
    

            }
        }
    
        return requests;
    }
    
    
    

    

    


    
    
}