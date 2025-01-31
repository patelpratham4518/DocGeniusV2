public with sharing class GoogleDocPreview {
    public static AuthProviderSettings__c authProvider = AuthProviderSettings__c.getInstance();
    public GoogleDocPreview() {

    }
    @AuraEnabled
    public static void doPreview(String googleDocId,String recordId,String objectApiName){
        try {
            googleDocId = '118c3SPxIHCFqC_rPKn8ULBlK7DxSLhzz9q0JLnwjZkM';

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
                
                List<Object> requests = formatContentForBatchUpdate(bodyContentNew,bodyContentOriginal,recordId,objectApiName);
                updateGoogleDoc(newGoogleDocId, requests);
                attachment.Body = getPDF(newGoogleDocId);

                
            } catch (Exception e) {
                System.debug('Error In doPreview while between copy and delete ==> '+e.getMessage());
                // Log_Handler.store_Exception(e,'GoogleDocPreview','doPreview');
            } finally {
                
                Boolean googleDocDeleted = deleteGoogleDoc(newGoogleDocId);
                System.debug('Result of Google Doc Deleted ==>'+googleDocDeleted);
                upsert authProvider;
                insert attachment;
                
            }
           

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
                    return responsePending;
                }
            }
    
            System.debug('Token refresh failed. Status Code: ' + response.getStatusCode());
            System.debug('Response Body: ' + response.getBody());
            return null;
        } catch (Exception e) {
            System.debug('Error In refreshAccessToken ==> '+e.getMessage());
            // Log_Handler.store_Exception(e,'GoogleDocPreview','refreshAccessToken');
            return null;
        }

    }

    public static String getDocument(String googleDocId) {
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents/'+googleDocId;
            
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('GET');
            request.setHeader('Authorization','Bearer '+authProvider.access_token__c);
            Http http = new Http();
            HttpResponse response = http.send(request);
            // System.debug('Response of get doc ==>'+response.getBody());
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
                // System.debug('Response of get doc ==>'+response.getBody());
                return response.getBody();
             }
             return null;
            } catch (Exception e) {
                System.debug('Error In getDocument ==> '+e.getMessage());
                // Log_Handler.store_Exception(e,'GoogleDocPreview','getDocument');
                return null;
        }
    }

    public static String copyGoogleDoc(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId+'/copy';
            
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
            // Log_Handler.store_Exception(e,'GoogleDocPreview','copyGoogleDoc');
            return null;
        }
    }

    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContentNew, List<Object> bodyContentOriginal,String recordId,String objectApiName) {
        try {
            List<Object> requests = new List<Object>();
            List<Object> tableRequests = new List<Object>();
        
            Integer originalIndex = 0;
            Integer tableOffset = 0;
            Integer currentTableOffset = 0;

            formatTableRecords(bodyContentNew,recordId,objectApiName);


            for (Object newElement : bodyContentNew) {
                Map<String, Object> newElementMap = (Map<String, Object>) newElement;
                Map<String, Object> originalElementMap = (Map<String, Object>) bodyContentOriginal[originalIndex];
        
                if (newElementMap.containsKey('paragraph') && originalElementMap.containsKey('paragraph')) {
                    Map<String, Object> newParagraph = (Map<String, Object>) newElementMap.get('paragraph');
                    Map<String, Object> originalParagraph = (Map<String, Object>) originalElementMap.get('paragraph');
                    //optimization
                    if (JSON.serialize(newParagraph) == JSON.serialize(originalParagraph)) {
                        originalIndex++;
                        continue;
                    }
                    //end optimization
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

                    Integer columns =Integer.valueOf(originalTable.get('columns')) ;
                  
                    Integer tableStartLocation = (Integer) originalElementMap.get('startIndex');
                    tableStartLocation += tableOffset;
                    List<Object> originalTableRows = (List<Object>) originalTable.get('tableRows');
                    List<Object> newTableRows = (List<Object>) newTable.get('tableRows');
        
                    
                    //Insert empty rows equal to number of records
                    Map<String, Object> firstRow = (Map<String, Object>) newTableRows[0];
                    Map<String, Object> secondRow = (Map<String, Object>) newTableRows[1];
                    Map<String, Object> thirdRow = (Map<String, Object>) newTableRows[2];
                    List<List<String>> tableRecords = getTableRecords(secondRow,thirdRow,recordId,objectApiName);
                    if (tableRecords == null) {
                        System.debug('Null Table records');
                        originalIndex++;
                        continue;
                    }
                    Integer numberOfRecords = tableRecords.size();

                    // for (Integer i = 2; i <= numberOfRecords+1; i++) {
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

                    List<Integer> rowsToDelete = new List<Integer>{1,numberOfRecords+1};
                    for (Integer deleteIndex : rowsToDelete) {
                         Map<String,Object> deleteTableRowRequest = new Map<String,Object>{
                            'deleteTableRow' => new Map<String,Object>{
                                'tableCellLocation' => new Map<String, Object>{
                                    'tableStartLocation' => new Map<String, Object>{
                                        'segmentId' => '',
                                        'index' => tableStartLocation
                                    },
                                    'rowIndex' => deleteIndex, // The row index where the new row will be inserted (0-based index)
                                    'columnIndex' => 0 // This is required but can be 0 for row insertion
                                }
                            }
                        };
                        tableRequests.add(deleteTableRowRequest);

                        if (deleteIndex == (numberOfRecords+1)) {
                            deleteIndex = 2;
                        }
                        Map<String, Object> deletingRow = (Map<String, Object>) newTableRows[deleteIndex];
                        tableOffset -= (Integer.valueOf(deletingRow.get('endIndex')) - Integer.valueOf(deletingRow.get('startIndex')));
                        
                    }


                    // Insert Text in empty table rows
                    Integer insertCellTextIndex = Integer.valueOf(firstRow.get('endIndex')) ;
                    insertCellTextIndex += currentTableOffset;
                    
                    for (List<String> record : tableRecords) {
                        insertCellTextIndex++;
                        tableOffset ++;
                        for (String columnText : record) {
                            if (columnText != null) {
                                String insertionText = columnText;
                                Map<String, Object> insertTextRequest = new Map<String, Object>{
                                        'insertText' => new Map<String, Object>{
                                                'text' => insertionText,
                                                'location' => new Map<String, Object>{
                                                    'segmentId' => '',
                                                    'index' => insertCellTextIndex+1
                                                }
                                        }
                                };
                                tableRequests.add(insertTextRequest);
                                insertCellTextIndex += insertionText.length();          
                                tableOffset += insertionText.length();          
                            }
                            insertCellTextIndex += 2;
                            tableOffset += 2;
                        }
                    }

                    currentTableOffset = tableOffset;
                    // End table
                }
                
                originalIndex++;
            }
            
            requests.addAll(tableRequests);
            return requests;
        } catch (Exception e) {
            System.debug('Error In formatContentForBatchUpdate ==> '+e.getMessage());
            // Log_Handler.store_Exception(e,'GoogleDocPreview','formatContentForBatchUpdate');
            return null;
        }

    }

    public static void updateGoogleDoc(String googleDocId,List<Object> requests) {
        try {
            String endpoint = 'https://docs.googleapis.com/v1/documents/'+googleDocId+'/:batchUpdate';
            
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
            // Log_Handler.store_Exception(e,'GoogleDocPreview','updateGoogleDoc');
        }
 
    }

    public static Blob getPDF(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId+'/export';

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
            // System.debug('Response=>'+response);
            // System.debug('Body of pdf=>'+response.getBody());
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
            // Log_Handler.store_Exception(e,'GoogleDocPreview','getPDF');
            return null;
        }
        
    }

    public static Boolean deleteGoogleDoc(String googleDocId) {
    // public static void deleteGoogleDoc(String googleDocId) {
        try {
            String endpoint = 'https://www.googleapis.com/drive/v3/files/'+googleDocId;
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
               System.debug('Response of delete google doc=>'+response);
               System.debug('ResponseBody of delete google doc=>'+response.getBody());
               return true;
            } else if (response.getStatusCode() == 401) {
                System.debug('Here is some error 401');
                response = refreshAccessToken(authProvider,request);
            }
            System.debug('Response of delete google doc=>'+response);
            System.debug('ResponseBody of delete google doc=>'+response.getBody());
            if (response.getStatusCode() == 204) {      
                //document deleted
                return true;
            }else {
                return false;
            }

        } catch (Exception e) {
            System.debug('Error In deleteGoogleDoc ==> '+e.getMessage());
            // Log_Handler.store_Exception(e,'GoogleDocPreview','deleteGoogleDoc');
            return false;
        }

    }

    public static List<List<String>> getTableRecords(Map<String,Object> secondRow,Map<String,Object> thirdRow,String recordId,String objectApiName) {
        
        try {
            String crn = JSON.serialize(thirdRow).substringBetween('$childRelation:', '$');
            // String crn = JSON.serialize(thirdRow).substringBetween('$crn:', '$');
            String limitOfRecords  = JSON.serialize(thirdRow).substringBetween('$limit:', '$');
            String filter  = JSON.serialize(thirdRow).substringBetween('$filter:', '$');
            Boolean isIndexing = JSON.serialize(secondRow).contains('{{No.Index}}');

            String childObjApi = JSON.serialize(thirdRow).substringBetween('$objApi:', '$');
        
            if ((crn == null) || (childObjApi == null)) {
                System.debug('return null from getTableRecords because  crn  is missing');
                return null;
            }

            List<String> validFields = new List<String>();
            for (Schema.SObjectField field : Schema.getGlobalDescribe().get(childObjApi).getDescribe().fields.getMap().values()){
                validFields.add(field.getDescribe().getName());            
            } 
            
            List<String> keys  = new  List<String>();
            Map<Integer,String> absolutes = new Map<Integer,String>();
            String keyString = '';
            List<Object> cells = (List<Object>) secondRow.get('tableCells');
            Integer columnNumber = 0;

            for (Object cell : cells) {
                String key = JSON.serialize(cell).substringBetween('{{!', '}}');
                if (key != null) {
                    if (validFields.contains(key)) {
                        keys.add(key);
                    } else {
                        absolutes.put(columnNumber, key);
                    }
                } else {
                    Map<String,Object> cellMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(cell));
                    List<Object> content = (List<Object>) cellMap.get('content');
                    
                    for (Object c : content) {
                        Map<String,Object> cMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(c));
                        Map<String,Object> paragraph = (Map<String,Object>) cMap.get('paragraph');
                        List<Object> elements =(List<Object>) paragraph.get('elements');
                        for (Object element : elements) {
                            Map<String,Object> elementMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(element));
                            if (elementMap.containsKey('textRun')) {
                                Map<String,Object> textRun = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(elementMap.get('textRun')));
                                String absoluteText = String.valueOf(textRun.get('content'));
                                absoluteText =  absoluteText.trim();
                                if (String.isNotBlank(absoluteText)) {                                    
                                    absolutes.put(columnNumber, absoluteText);
                                }
                            }
                        }
                    }
                }
                columnNumber++;
            }

            
            String queryString = 'SELECT Name, (SELECT ' + String.join(keys, ',') + ' FROM ' + crn;
            String whereClause = '';
            if (String.isNotBlank(filter)) {
                whereClause += ' WHERE ' + filter;
            }
            if (String.isNotBlank(limitOfRecords)) {
                whereClause += ' LIMIT ' + limitOfRecords;
            }
            queryString += whereClause + ') FROM ' + objectApiName + ' WHERE Id=:recordId';
            
            
            List<SObject> recordsMain = Database.query(queryString);
            List<Object> records = (List<Object>) recordsMain[0].getPopulatedFieldsAsMap().get(crn);
            
            List<List<String>> tableRecords = new LiSt<List<String>>();
            for (Object record : records) {
                List<String> row = new List<String>();
                for (String column : keys) {
                    row.add(String.valueOf(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(record))).get(column)));
                }
                tableRecords.add(row);
            }
            
            for (Integer column : absolutes.keySet()) {
                String absoluteText = absolutes.get(column);
                
                for (List<String> record : tableRecords) {
                    
                    if (column < tableRecords.size()) {
                        record.add(column,absoluteText);
                    }else {
                        record.add(absoluteText);
                    }
                }
            }

            if (isIndexing == true) {
                Integer index = 1;
                for (List<String> record : tableRecords) {
                    record[0] = String.valueOf(index);
                    index++;
                }
            }
            
            return tableRecords;
        } catch (Exception e) {
            System.debug('Error In getTableRecords ==> '+e.getMessage()+e.getStackTraceString());
            // Log_Handler.store_Exception(e,'GoogleDocPreview','getTableRecords');
            return null;
        }
      }
 
    public static void formatTableRecords(List<Object> bodyContentNew,String recordId,String objectApiName) {
        try {
            List<Table> tables = new List<Table>();
            List<String> childQueries = new List<String>();
            for (Object newElement : bodyContentNew) {
                Map<String, Object> newElementMap = (Map<String, Object>) newElement;
                if (newElementMap.containsKey('table')) {
                    Map<String, Object> newTable = (Map<String, Object>) newElementMap.get('table');
                    List<Object> newTableRows = (List<Object>) newTable.get('tableRows');
                    Map<String, Object> secondRow = (Map<String, Object>) newTableRows[1];
                    Map<String, Object> thirdRow = (Map<String, Object>) newTableRows[2];
                    Table table = getChildQuery(secondRow, thirdRow, recordId, objectApiName);
                    if (table != null) {
                        tables.add(table);
                        childQueries.add(table.childQuery);
                    }else {
                        tables.add(new Table());
                    }
                    
                }
                
            }
            
            String queryString = 'SELECT '+String.join(childQueries, ',')+' FROM ' + objectApiName + ' WHERE Id=:recordId';
            SObject mainObject = Database.query(queryString);

            setTableRecordsFromMainRecord(mainObject, tables);
            
        } catch (Exception e) {
            System.debug('Error In formatTableRecords ==> '+e.getMessage());
        }

    }

    public static Table getChildQuery(Map<String,Object> secondRow,Map<String,Object> thirdRow,String recordId,String objectApiName) {
        try {
            String crn = JSON.serialize(thirdRow).substringBetween('$childRelation:', '$');
            String limitOfRecords  = JSON.serialize(thirdRow).substringBetween('$limit:', '$');
            String filter  = JSON.serialize(thirdRow).substringBetween('$filter:', '$');
            Boolean isIndexing = JSON.serialize(secondRow).contains('{{No.Index}}');

            String childObjApi = JSON.serialize(thirdRow).substringBetween('$objApi:', '$');
        
            if ((crn == null) || (childObjApi == null)) {
                System.debug('return null from getChildQuery because  childRelation or objApi  is missing');
                return null;
            }

            List<String> validFields = new List<String>();
            for (Schema.SObjectField field : Schema.getGlobalDescribe().get(childObjApi).getDescribe().fields.getMap().values()){
                validFields.add(field.getDescribe().getName());            
            } 
            
            List<String> keys  = new  List<String>();
            Map<Integer,String> absolutes = new Map<Integer,String>();
            String keyString = '';
            List<Object> cells = (List<Object>) secondRow.get('tableCells');
            Integer columnNumber = 0;

            for (Object cell : cells) {
                String key = JSON.serialize(cell).substringBetween('{{!', '}}');
                if (key != null) {
                    if (validFields.contains(key)) {
                        keys.add(key);
                    } else {
                        absolutes.put(columnNumber, key);
                    }
                } else {
                    Map<String,Object> cellMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(cell));
                    List<Object> content = (List<Object>) cellMap.get('content');
                    
                    for (Object c : content) {
                        Map<String,Object> cMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(c));
                        Map<String,Object> paragraph = (Map<String,Object>) cMap.get('paragraph');
                        List<Object> elements =(List<Object>) paragraph.get('elements');
                        for (Object element : elements) {
                            Map<String,Object> elementMap = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(element));
                            if (elementMap.containsKey('textRun')) {
                                Map<String,Object> textRun = (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(elementMap.get('textRun')));
                                String absoluteText = String.valueOf(textRun.get('content'));
                                absoluteText =  absoluteText.trim();
                                if (String.isNotBlank(absoluteText)) {                                    
                                    absolutes.put(columnNumber, absoluteText);
                                }
                            }
                        }
                    }
                }
                columnNumber++;
            }

            String queryString = '(SELECT ' + String.join(keys, ',') + ' FROM ' + crn;
            String whereClause = '';
            if (String.isNotBlank(filter)) {
                whereClause += ' WHERE ' + filter;
            }
            if (String.isNotBlank(limitOfRecords)) {
                whereClause += ' LIMIT ' + limitOfRecords;
            }
            queryString += whereClause + ')';
            Table table = new Table();
            table.childQuery = queryString;
            table.crn = crn;
            table.absolutes = absolutes;
            table.isIndexing = isIndexing;
            table.keys = keys;
            return table;

        } catch (Exception e) {
            System.debug('Error In getChildQuery ==> '+e.getMessage());
            return null;
        }
    }

    public class Table {
        public String childQuery;
        public String crn;
        public Map<Integer,String> absolutes;
        public Boolean isIndexing;
        public List<String>keys;
        public List<List<String>> tableRecords;
    }

    public static void setTableRecordsFromMainRecord(Object mainObject,List<Table> tables) {
        List<List<List<String>>> allTableRecords = new List<List<List<String>>>();
        for (Table table : tables) {
            if (table.crn != null) {
                
            } else {
                allTableRecords.add(null);
            }
        } 
    }

}