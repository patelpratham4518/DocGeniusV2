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

    public static string createNewDoc(String title) {
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
            System.debug('Response of create doc==>'+response);
            System.debug('Response body=>'+response.getBody());
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
            return String.valueOf(responseMap.get('documentId'));
        }
        catch(Exception e){
            System.debug('Error in create doc ==> '+e.getMessage());
            return null;
        }
    }

    public static void updateDoc(String documentId, String modifiedContent,List<Object> requests) {
 
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

    public static void main() {
        String docId = createNewDoc('Check merge fields');
        String sourceDocContent = getDocument('1Dga4sbG65SM8dDbEiA3yRfvTeGXmafOlb2J9B_Goy2Q');
        String modifiedHTML = sourceDocContent;
        modifiedHTML = KeyMappingController.mappingObjFieldsData(modifiedHTML, '001H4000008UpuCIAS', 'Account');
        modifiedHTML = KeyMappingController.mappingGeneralFieldData(modifiedHTML);
        modifiedHTML = KeyMappingController.mappingMergeTemplate(modifiedHTML);
        sourceDocContent = modifiedHTML;

        List<Object> bodyContent = (List<Object>) ((Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('body')))).get('content');
      
        Map<String,Object> inlineObjects = (Map<String,Object>) ((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('inlineObjects');
        Map<String,Object> positionedObjects = (Map<String,Object>) ((Map<String,Object>) JSON.deserializeUntyped(sourceDocContent)).get('positionedObjects');
       
        List<Object> requests = formatContentForBatchUpdate(bodyContent,inlineObjects,positionedObjects);
        
        // CreateGoogleDoc.updateDoc('10MsBRbypmPhC_mhubaDNEXCLpRmXplFezzBdUVGc9Ic',sourceDocContent,requests);
        CreateGoogleDoc.updateDoc(docId,sourceDocContent,requests);
        getPDF(docId);
        deleteDoc(docId);
    }

    // original     
    // public static List<Object> formatContentForBatchUpdate(List<Object> bodyContent, Map<String, Object> inlineObjects, Map<String, Object> positionedObjects) {
        
    //     List<Object> requests = new List<Object>();
    //     Integer currentIndex = 1;

    //     for (Object element : bodyContent) {
    //         Map<String, Object> elementMap = (Map<String, Object>) element;
            
    //         if (elementMap.containsKey('paragraph')) {
    //             Map<String, Object> paragraph = (Map<String, Object>) elementMap.get('paragraph');
    //             List<Object> elements = (List<Object>) paragraph.get('elements');

    //             for (Object el : elements) {
    //                 Map<String, Object> elMap = (Map<String, Object>) el;
    //                 if (elMap.containsKey('textRun')) {
    //                     Map<String, Object> textRun = (Map<String, Object>) elMap.get('textRun');
    //                     if (textRun != null) {
    //                         String text = (String) textRun.get('content');
    //                         Map<String, Object> textStyle = (Map<String, Object>) textRun.get('textStyle');

    //                         Map<String, Object> insertTextRequest = new Map<String, Object>{
    //                             'insertText' => new Map<String, Object>{
    //                                 'location' => new Map<String, Object>{
    //                                     'index' => currentIndex
    //                                 },
    //                                 'text' => text
    //                             }
    //                         };

    //                         requests.add(insertTextRequest);

    //                         if (textStyle != null) {
    //                             Map<String, Object> updateTextStyleRequest = new Map<String, Object>{
    //                                 'updateTextStyle' => new Map<String, Object>{
    //                                     'range' => new Map<String, Object>{
    //                                         'startIndex' => currentIndex,
    //                                         'endIndex' => currentIndex + text.length()
    //                                     },
    //                                     'textStyle' => textStyle,
    //                                     'fields' => '*'
    //                                 }
    //                             };

    //                             requests.add(updateTextStyleRequest);
    //                         }

    //                         currentIndex += text.length();
    //                     }
    //                 } else if (elMap.containsKey('inlineObjectElement')) {
                        
    //                     String inlineObjectId = (String) ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(elMap.get('inlineObjectElement')))).get('inlineObjectId');
    //                     if (inlineObjects.containsKey(inlineObjectId)) {
    //                         Map<String, Object> inlineObject = (Map<String, Object>) inlineObjects.get(inlineObjectId);
                           
    //                         String imageUrl = (String) ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(inlineObject.get('embeddedObject')))).get('contentUri');
    //                         // System.debug('Image URL==>'+imageUrl);
                            
    //                         Map<String, Object> insertInlineImageRequest = new Map<String, Object>{
    //                             'insertInlineImage' => new Map<String, Object>{
    //                                 'location' => new Map<String, Object>{
    //                                     'index' => currentIndex
    //                                 },
    //                                 'uri' => imageUrl,
    //                                 'objectSize' => new Map<String, Object>{
                                       
    //                                     'height' => ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(inlineObject.get('embeddedObject')))).get('size')))).get('height'),
                                      
    //                                     'width' => ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(inlineObject.get('embeddedObject')))).get('size')))).get('width')
    //                                 }
    //                             }
    //                         };
                            
    //                         requests.add(insertInlineImageRequest);
    //                         currentIndex += 1; // Move the index forward
    //                     }
    //                 }
    //             }


    //             // Handle positioned objects in the paragraph
    //             if (paragraph.containsKey('positionedObjectIds')) {
                  
    //                 List<Object> positionedObjectIdsObject = (List<Object>) paragraph.get('positionedObjectIds');
    //                 List<String> positionedObjectIds = new List<String>();
                    
    //                 for(object positionedObjectId : positionedObjectIdsObject){
    //                     string po = String.valueOf(positionedObjectId);
    //                     positionedObjectIds.add(po);

    //                 }
    //                 for (String positionedObjectId : positionedObjectIds) {
    //                     if (positionedObjects.containsKey(positionedObjectId)) {
    //                         Map<String, Object> positionedObject = (Map<String, Object>) positionedObjects.get(positionedObjectId);
                            
    //                         // Object positionedObjectProperties = positionedObject.get('positionedObjectProperties');
    //                         Map<String, Object> positionedObjectProperties =(Map<String, Object>) positionedObject.get('positionedObjectProperties');
    //                         Object embeddedObject =  ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(positionedObjectProperties))).get('embeddedObject');
    //                         Object imageProperties =  ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(embeddedObject))).get('imageProperties');
    //                         String imageUrl = (String)  ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(imageProperties))).get('contentUri');
    //                         Map<String, Object> size =  (Map<String, Object>)  ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(embeddedObject))).get('size');


    //                         Map<String, Object> insertPositionedImageRequest = new Map<String, Object>{
    //                             'insertInlineImage' => new Map<String, Object>{
    //                             // 'insertPositionedObject' => new Map<String, Object>{
    //                                 'location' => new Map<String, Object>{
    //                                     'index' => currentIndex
    //                                 },
    //                                 'uri' => imageUrl,
    //                                 'objectSize' => new Map<String, Object>{
                                        
    //                                     'height' => size.get('height'),
    //                                     'width' => size.get('width')
                                        
    //                                 }
    //                                 // 'positionedObjectProperties' => positionedObject.get('positionedObjectProperties')
                                    
    //                             }
    //                         };
    //                         requests.add(insertPositionedImageRequest);
                            
    //                         currentIndex += 1; // Move the index forward
                            

                            
    //                     }

                        
    //                 }
    //             }
    //         } else if (elementMap.containsKey('positionedObjectElement')) {
                
               
    //             String positionedObjectId = (String) ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(elementMap.get('positionedObjectElement')))).get('positionedObjectId');
    //             if (positionedObjects.containsKey(positionedObjectId)) {
    //                 Map<String, Object> positionedObject = (Map<String, Object>) positionedObjects.get(positionedObjectId);
                    
    //                 String imageUrl = (String) ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(positionedObject.get('embeddedObject')))).get('imageProperties')))).get('contentUri');
                    
                    
                    
    //                 Map<String, Object> insertPositionedImageRequest = new Map<String, Object>{
    //                     'insertPositionedImage' => new Map<String, Object>{
    //                         'location' => new Map<String, Object>{
    //                             'index' => currentIndex
    //                         },
    //                         'uri' => imageUrl,
    //                         'objectSize' => new Map<String, Object>{

    //                             'height' => ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(positionedObject.get('embeddedObject')))).get('size')))).get('height'),

    //                             'width' => ((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(positionedObject.get('embeddedObject')))).get('size')))).get('width')
    //                         },
    //                         'positionedObjectProperties' => positionedObject.get('positionedObjectProperties')
    //                     }
    //                 };

    //                 requests.add(insertPositionedImageRequest);
    //                 currentIndex += 1; 
    //             }
    //         }
    //     }

    //     return requests;
    // }

    // chatgpt
    public static List<Object> formatContentForBatchUpdate(List<Object> bodyContent, Map<String, Object> inlineObjects, Map<String, Object> positionedObjects) {
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
                    } else if (elMap.containsKey('inlineObjectElement')) {
                        String inlineObjectId = (String) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(elMap.get('inlineObjectElement')))).get('inlineObjectId');
                        if (inlineObjects.containsKey(inlineObjectId)) {
                            Map<String, Object> inlineObject = (Map<String, Object>) inlineObjects.get(inlineObjectId);
                            
                            String imageUrl = (String) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(inlineObject.get('embeddedObject')))).get('contentUri');
                            
                            Map<String, Object> size = (Map<String, Object>) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(inlineObject.get('embeddedObject')))).get('size');
                            
                            Map<String, Object> insertInlineImageRequest = new Map<String, Object>{
                                'insertInlineImage' => new Map<String, Object>{
                                    'location' => new Map<String, Object>{
                                        'index' => currentIndex
                                    },
                                    'uri' => imageUrl,
                                    'objectSize' => new Map<String, Object>{
                                        'height' => size.get('height'),
                                        'width' => size.get('width')
                                    }
                                }
                            };
    
                            requests.add(insertInlineImageRequest);
                            
                            currentIndex += 1; // Move the index forward
                        }
                    }
                }
    
                // Handle positioned objects in the paragraph
                if (paragraph.containsKey('positionedObjectIds')) {
                    List<Object> positionedObjectIdsObject = (List<Object>) paragraph.get('positionedObjectIds');
                    List<String> positionedObjectIds = new List<String>();
    
                    for (Object positionedObjectId : positionedObjectIdsObject) {
                        String po = String.valueOf(positionedObjectId);
                        positionedObjectIds.add(po);
                    }
                    for (String positionedObjectId : positionedObjectIds) {
                        if (positionedObjects.containsKey(positionedObjectId)) {
                            Map<String, Object> positionedObject = (Map<String, Object>) positionedObjects.get(positionedObjectId);
                            
                            Map<String, Object> positionedObjectProperties = (Map<String, Object>) positionedObject.get('positionedObjectProperties');
                            Map<String, Object> embeddedObject = (Map<String, Object>) positionedObjectProperties.get('embeddedObject');
                            Map<String, Object> imageProperties = (Map<String, Object>) embeddedObject.get('imageProperties');
                            String imageUrl = (String) imageProperties.get('contentUri');
                            Map<String, Object> size = (Map<String, Object>) embeddedObject.get('size');
    
                            Map<String, Object> insertInlineImageRequest = new Map<String, Object>{
                                'insertInlineImage' => new Map<String, Object>{
                                    'location' => new Map<String, Object>{
                                        'index' => currentIndex
                                    },
                                    'uri' => imageUrl,
                                    'objectSize' => new Map<String, Object>{
                                        'height' => size.get('height'),
                                        'width' => size.get('width')
                                    }
                                }
                            };
    
                            requests.add(insertInlineImageRequest);
    
                            // Add update paragraph style to wrap text around the image
                            Map<String, Object> updateParagraphStyleRequest = new Map<String, Object>{
                                'updateParagraphStyle' => new Map<String, Object>{
                                    'range' => new Map<String, Object>{
                                        'startIndex' => currentIndex - 1,  // Positioning the previously inserted inline image
                                        'endIndex' => currentIndex
                                    },
                                    'paragraphStyle' => new Map<String, Object>{
                                        'alignment' => 'CENTER'  // Example alignment, change as needed
                                    },
                                    'fields' => 'alignment'
                                }
                            };
                            requests.add(updateParagraphStyleRequest);
    
                            currentIndex += 1; // Move the index forward
                        }
                    }
                }
            } else if (elementMap.containsKey('positionedObjectElement')) {
                String positionedObjectId = (String) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(elementMap.get('positionedObjectElement')))).get('positionedObjectId');
                if (positionedObjects.containsKey(positionedObjectId)) {
                    Map<String, Object> positionedObject = (Map<String, Object>) positionedObjects.get(positionedObjectId);
                    
                    String imageUrl = (String) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(positionedObject.get('embeddedObject')))).get('imageProperties')))).get('contentUri');
                    Map<String, Object> size = (Map<String, Object>) ((Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(positionedObject.get('embeddedObject')))).get('size');
                    
                    Map<String, Object> insertInlineImageRequest = new Map<String, Object>{
                        'insertInlineImage' => new Map<String, Object>{
                            'location' => new Map<String, Object>{
                                'index' => currentIndex
                            },
                            'uri' => imageUrl,
                            'objectSize' => new Map<String, Object>{
                                'height' => size.get('height'),
                                'width' => size.get('width')
                            }
                        }
                    };
    
                    requests.add(insertInlineImageRequest);
                    currentIndex += 1;
                }
            }
        }
    
        return requests;
    }
    
    
    

    public static void getPDF(String googleDocId) {
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
            insert attachment;
        } 
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

}



 