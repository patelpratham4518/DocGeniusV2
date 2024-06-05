public with sharing class TemplateBuilder_Controller {

    public static string mappingSymbol = '#';

    @AuraEnabled
    public static retrunWrapper getTemplateData(String templateId){
        RetrunWrapper retrunWrapper = new RetrunWrapper();

        try {

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Fields__r ORDER BY Order_No_Simple__c ASC )
                                FROM Template__c WHERE Id =: templateId LIMIT 1];

            if(temp.size() > 0){
                SYSTEM.debug('Template__c : ' + temp[0]);
                if(temp[0].Template_Type__c == 'Simple Template'){
                    retrunWrapper.template = temp[0];
                    retrunWrapper.isSuccess = true;
                }
                else{
                    retrunWrapper.returnMessage = 'Template Type Must Be Simple Template.';
                    retrunWrapper.isSuccess = false;
                }
            }
            else{
                retrunWrapper.returnMessage = 'Template Not Found';
                retrunWrapper.isSuccess = false;
            }

            return retrunWrapper;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'getTemplateData');
            system.debug('exception in getTemplateData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    @AuraEnabled
    public static retrunWrapper getFieldMappingKeys(String sourceObjectAPI){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try{
            list<mappingObjects> objWithFields = new list<mappingObjects>();

            Obj_Label_API objLabelAPI = new Obj_Label_API();
            String sourceObjectName = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().getName();
            String sourceObjectLabel = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().getLabel();
            objLabelAPI.name = sourceObjectName;
            objLabelAPI.label = sourceObjectLabel;


            // add base (self) object in Object List...
            List<Schema.DescribeFieldResult> objectField_self = getObjectFields(sourceObjectName);
            list<Field_Label_Key> fieldMappingList_self = new list<Field_Label_Key>();
            for(Schema.DescribeFieldResult field : objectField_self){

                string fieldKey = '{{'+mappingSymbol+field.getName()+'}}';

                Field_Label_Key fieldMapping = new Field_Label_Key();
                fieldMapping.label = field.getLabel();
                fieldMapping.name = field.getName();
                fieldMapping.key = fieldKey;
                fieldMappingList_self.add(fieldMapping);
            }
            mappingObjects mapObj_self = new mappingObjects();
            mapObj_self.label = sourceObjectLabel;
            mapObj_self.name = sourceObjectName;
            mapObj_self.objectAPI = sourceObjectName;
            mapObj_self.objectLabel = sourceObjectLabel;
            mapObj_self.fieldMappings = fieldMappingList_self;
            objWithFields.add(mapObj_self);

            // add related Object in Object list...
            List<relatedObjProperty> relatedObjects = getRelatedObjects(sourceObjectAPI);
            for(relatedObjProperty relatedObj : relatedObjects){
                list<Field_Label_Key> fieldMappingList = new list<Field_Label_Key>();

                // get Object Information...
                Schema.SObjectType sobjType = Schema.getGlobalDescribe().get(relatedObj.parentObjApi);
                String objLabel = sobjType.getDescribe().getLabel();
                String objName = relatedObj.parentObjApi;

                List<Schema.DescribeFieldResult> objectField = getObjectFields(relatedObj.parentObjApi);
                for(Schema.DescribeFieldResult field : objectField){

                    String fieldNameToSet = relatedObj.parentObjRelationshipName +'.'+ field.getName();
                    string fieldKey = '{{'+mappingSymbol+relatedObj.parentObjRelationshipName +'.'+ field.getName()+'}}';

                    Field_Label_Key fieldMapping = new Field_Label_Key();
                    fieldMapping.label = field.getLabel();
                    fieldMapping.name = fieldNameToSet;
                    fieldMapping.key = fieldKey;
                    fieldMappingList.add(fieldMapping);
                }

                mappingObjects mapObj = new mappingObjects();
                mapObj.label = sourceObjectLabel +' > '+relatedObj.parentObjFieldLabel;
                mapObj.name = relatedObj.parentObjFieldApi;
                mapObj.objectAPI = relatedObj.parentObjApi;
                mapObj.objectLabel = objLabel;
                mapObj.fieldMappings = fieldMappingList;
                objWithFields.add(mapObj);
            }

            // Assign Valus to Return Wrapper...
            retrunWrapper.isSuccess = relatedObjects != null ? (true) : (false);
            retrunWrapper.returnMessage = 'success';
            retrunWrapper.objectLabelAPI = objLabelAPI;
            retrunWrapper.fieldMappingsWithObj = objWithFields;
            return retrunWrapper;
        }
        catch(Exception e){
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'getFieldMappingKeys');
            system.debug('exception in getFieldMappingKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    public static List<relatedObjProperty> getRelatedObjects(String sourceObjectAPI) {
        try {
            Set<String> parentObjects = new Set<String>();
            List<relatedObjProperty> relatedObjs = new List<relatedObjProperty>();
            Map<String, Schema.SObjectField> mapOfFields = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().fields.getMap();
            for(String fieldName : mapOfFields.keySet()){
                Schema.SObjectField fieldObj = mapOfFields.get(fieldName);
                Schema.DescribeFieldResult field = fieldObj.getDescribe();
                if(field.getType() == Schema.DisplayType.REFERENCE){
                    if(string.valueOf(field.getReferenceTo()[0]) != sourceObjectAPI){
                        relatedObjProperty relatedObj = new relatedObjProperty();
                        string fieldLabel = field.getLabel().contains(' ID') == true ? field.getLabel().substringBefore(' ID') : field.getLabel();
                        relatedObj.parentObjFieldLabel = fieldLabel;
                        relatedObj.parentObjRelationshipName = field.getRelationshipName();
                        relatedObj.parentObjFieldApi = fieldName;
                        relatedObj.parentObjApi = string.valueOf(field.getReferenceTo()[0]);
                        relatedObj.isCustome = field.isCustom();
                        // System.debug('relatedObj : ' + fieldObj);
                        // System.debug('====== ======== ========= ======== ========= ========= ===========');
                        relatedObjs.add(relatedObj);
                        parentObjects.add(string.valueOf(field.getReferenceTo()[0]));
                    }
                }
            }

            return relatedObjs;
            // return new List<String>(parentObjects);
        } catch (Exception e) {
            system.debug('exception in getRelatedObjects : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    public static List<Schema.DescribeFieldResult> getObjectFields(String objAPI){
        try {
            List<Schema.DescribeFieldResult> objectFields = new List<Schema.DescribeFieldResult>();

            Schema.SObjectType sobjType = Schema.getGlobalDescribe().get(objAPI);
            Schema.DescribeSObjectResult r = sobjType.getDescribe();
            Map<String, Schema.SObjectField> mapOfFields = r.fields.getMap();
            List<String> FieldsList = new List<String>(mapOfFields.keySet());
            FieldsList.sort();

            for(String fieldName : FieldsList){
                Schema.SObjectField field = mapOfFields.get(fieldName);
                Schema.DescribeFieldResult f = field.getDescribe();
                objectFields.add(f);
            }

            return objectFields;

        } catch (Exception e) {
            system.debug('exception in getObjectFields : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    @AuraEnabled
    public static List<Map<String, String>> insertImgAsContentVersion(List<Map<String, String>> imgToInsert, String templateId){
        try {

            List<Map<String, String>> imgToInsert_return = new List<Map<String, String>>();
            List<ContentVersion> cvToInsert = new List<ContentVersion>();
            
            Template__c temp = [SELECT Id, Name FROM Template__c WHERE Id =: templateId LIMIT 1];

            System.debug('imgToInsert : ' + imgToInsert);
            
            if(imgToInsert.size() > 0){
                for(Map<String, String> img : imgToInsert){
                    system.debug('base : ' + img.get('base64'));
                    system.debug('imgIndex : ' + img.get('imgIndex'));
                    
                    ContentVersion cv = new ContentVersion();
                    String title = '__docGenius__' + temp.Name + img.get('imgIndex');
                    cv.Title = title;
                    cv.VersionData = EncodingUtil.base64Decode(img.get('base64'));
                    cv.PathOnClient = title+'.jpg';
                    img.put('Title', title);
                    imgToInsert_return.add(img);
                    cvToInsert.add(cv);
                }
                
                if(cvToInsert.size() > 0){
                    insert cvToInsert;
                }
    
                List<String> cvIds = new List<String>();
                for(ContentVersion cv : cvToInsert){
                    cvIds.add(cv.Id);
                }
                List<ContentVersion> inseredCVs = [SELECT Id,Title, ContentDocumentId, ContentUrl FROM ContentVersion WHERE Id IN : cvIds];
                
                Map<String, Id> cvTitel_cvId = new Map<String, Id>();
                List<ContentDocumentLink> cdlToInsert = new List<ContentDocumentLink>();
                for(ContentVersion cv : inseredCVs){
                    ContentDocumentLink contentlink = new ContentDocumentLink();
                    contentlink.LinkedEntityId = templateId;
                    contentlink.contentdocumentid = cv.ContentDocumentId;
                    contentlink.ShareType = 'V';
                    cdlToInsert.add(contentlink);
                    cvTitel_cvId.put(cv.Title, cv.Id);
                }
                if(cdlToInsert.size() > 0){
                    insert cdlToInsert;
                }
    
                for(Map<String, String> imgReturn : imgToInsert_return){
                    String src = '/sfc/servlet.shepherd/version/download/'  + cvTitel_cvId.get(imgReturn.get('Title'));
                    imgReturn.put('src', src);
                    imgReturn.put('id', cvTitel_cvId.get(imgReturn.get('Title')));
                }
                return imgToInsert_return;
            }

            return null;

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'insertImgAsContentVersion');
            system.debug('exception in insertImgAsContentVersion : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    @AuraEnabled
    public static string saveTemplateApex(Template__c templateRecord, List<String> templateValues, List<String> contentVersionIds){
        try {

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Fields__r ORDER BY Order_No_Simple__c),
                                                (SELECT Id, Name,Page_Number__c, Template__c FROM Template_Pages__r)
                                                FROM Template__c WHERE Id =: templateRecord.Id LIMIT 1];

            if(temp.size() > 0){
                Template__c templateToUpdate = temp[0];
                templateToUpdate.Template_Name__c = templateRecord.Template_Name__c;
                templateToUpdate.Template_Status__c = templateRecord.Template_Status__c;
                templateToUpdate.Description__c = templateRecord.Description__c;

                Integer totalFieldRecords = templateValues.size();

                if(templateToUpdate.Template_Fields__r.size() > 0){
                    Integer existingFieldRecords = templateToUpdate.Template_Fields__r.size(); 

                    List<Template_Fields__c>  tempFieldToUpdate = new  List<Template_Fields__c>(); 
                    List<Template_Fields__c>  tempFieldToInsert = new  List<Template_Fields__c>();
                    integer tempFieldIndex = 0;
                    for(integer i = 0; i< totalFieldRecords; i++){
                        // Update Template Field record when Template field record count under Existing Template Field Record's Count;
                        if(i < existingFieldRecords){
                            templateToUpdate.Template_Fields__r[i].Template_Value_Simple__c = templateValues[i];
                            tempFieldToUpdate.add(templateToUpdate.Template_Fields__r[i]);
                        }
                        // Insert Template Field record when Template Field record count Excced Existing Template Field Record's Count;
                        else if(i >= existingFieldRecords){
                            Template_Fields__c templateField = new Template_Fields__c();
                            templateField.Template__c = templateToUpdate.Id;
                            templateField.Template_Value_Simple__c = templateValues[i];
                            templateField.Order_No_Simple__c = (i + 1);
                            tempFieldToInsert.add(templateField);
                            tempFieldIndex++;
                        }
                    }
                    if(tempFieldToUpdate.size() > 0){
                        update tempFieldToUpdate;
                    }
                    if(tempFieldToInsert.size() > 0){
                        insert tempFieldToInsert;
                    }

                    // Delete extra expty Template Field record when Template field record count less than Existing Template Field Record's Count;
                    List<Template_Fields__c>  tempFieldToDelete = new  List<Template_Fields__c>();
                    if(totalFieldRecords < existingFieldRecords){
                        for(integer i = 0; i< existingFieldRecords; i++){
                            if(i >= totalFieldRecords){
                                tempFieldToDelete.add(templateToUpdate.Template_Fields__r[i]);
                            }
                        }
                    }
                    if(tempFieldToDelete.size() > 0){
                        delete tempFieldToDelete;
                    }
                    
                }
                else{
                        List<Template_Fields__c> templateFieldsToInsert = new List<Template_Fields__c>();
                        for(integer i = 0; i< totalFieldRecords; i++){
                            Template_Fields__c templateField = new Template_Fields__c();
                            templateField.Template__c = templateToUpdate.Id;
                            // templateField.Template_Page__c = temPageToInsert[i].Id;
                            templateField.Template_Value_Simple__c = templateValues[i];
                            templateField.Order_No_Simple__c = (i + 1);
                            templateFieldsToInsert.add(templateField);
                        }

                        insert templateFieldsToInsert;

                }
                update templateToUpdate;

                String manageContetnResult = manageImgsContentVersion(contentVersionIds, temp[0].Id);

                return 'Temlpate Updated Successfully || Manage ContentVersion : ' + manageContetnResult != null ? 'Success' : 'Error';
            }
            else{
                return 'Template Not Found';
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'saveTemplateApex');
            system.debug('exception in saveTemplateApex : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            return 'error';
        }
        
    }

    public static string manageImgsContentVersion(List<String> contentVersionIds, String templateId){
        try {

            System.debug('contentVersionIds : ' + contentVersionIds);

            if(contentVersionIds.size() > 0){
                // get Content Version Available in Template Data...
                List<ContentVersion> imgInData = [SELECT Id,Title, ContentDocumentId FROM ContentVersion WHERE Id IN : contentVersionIds ];
    
                List<String> cdIds = new List<String>();
                for(ContentVersion cv : imgInData){
                    cdIds.add(cv.ContentDocumentId);
                }
                
                // get ContentDocumentLink of Content Version Available in Template Data...
                List<ContentDocumentLink> tempConLink = [SELECT Id, LinkedEntityId, ContentDocumentId FROM ContentDocumentLink WHERE ContentDocumentId IN : cdIds AND LinkedEntityId =: templateId];
                Set<Id> tempConLinkIds = new Set<Id>();
                for(ContentDocumentLink cdl : tempConLink){ tempConLinkIds.add(cdl.Id); }
                
                Set<Id> conDocIdsToDelete = new Set<Id>();
                // get ContentDocumentLink of Content Version replated to Template record...
                List<ContentDocumentLink> allConLink = [SELECT Id, LinkedEntityId, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =: templateId];

                for(ContentDocumentLink cdl : allConLink){ 
                    // check if Content Version of template record is available in template data...using ContentDocumentId...
                    if(!tempConLinkIds.contains(cdl.Id)){
                        // if Content Version of template reocrd not available in Template data... add to list to delete it...
                        conDocIdsToDelete.add(cdl.ContentDocumentId);
                    }
                }
    
                if(conDocIdsToDelete.size() > 0){
                    // Query ContentDocument to delete from template record...
                    List<ContentDocument> conDocToDelete = [SELECT Id FROM ContentDocument WHERE Id IN : conDocIdsToDelete ];
    
                    if(conDocToDelete.size() > 0){
                        System.debug('conVersionToDelete : ' + conDocToDelete.size());
                        delete conDocToDelete;
                    }
                }
            }
            // If no content Version present in template data... delete all content Versions related to template record....
            else{ 
                Set<Id> conDocIdsToDelete = new Set<Id>();

                List<ContentDocumentLink> allConLink = [SELECT Id, LinkedEntityId, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =: templateId];
                for(ContentDocumentLink cdl : allConLink){ 
                    conDocIdsToDelete.add(cdl.ContentDocumentId);
                }

                if(conDocIdsToDelete.size() > 0){
                    List<ContentDocument> conDocToDelete = [SELECT Id FROM ContentDocument WHERE Id IN : conDocIdsToDelete ];
    
                    System.debug('conVersionToDelete : ' + conDocToDelete.size());
                    delete conDocToDelete;
                }
            }

            return 'content Version managed successfully';
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'manageImgsContentVersion');
            system.debug('exception in manageImgsContentVersion : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    @AuraEnabled
    public static String generateDocumnet(String paraData){
        try {
            string RecordName = 'test';
            Pagereference pg = Page.DocGeniusPDFGeneratorPage;
            pg.getParameters().put('paraData', paraData);
            // pg.getHeaders().put('content-disposition','attachment; filename=' + RecordName+ '.pdf');
            pg.getContentaspdf();
            return pg.getUrl();
            
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'generateDocumnet');
            system.debug('exception in generateDocumnet : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    public static Map<String, String> mappingFieldDataVF(String templateID, String recordId, String sourceObjectAPI){
        try {

            String innerHTML = '<div class="ql-container ql-snow ql-bubble"> <div class="ql-editor">';

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Fields__r ORDER BY Order_No_Simple__c ASC)
                                FROM Template__c WHERE Id =: templateID LIMIT 1];

            if(temp.size() > 0){
                for(Template_Fields__c fieldValue : temp[0].Template_Fields__r){
                    innerHTML += fieldValue.Template_Value_Simple__c;
                }
            }

            innerHTML += '</div></div>';
            
            return mappingFieldData(innerHTML, recordId, sourceObjectAPI);

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'mappingFieldDataVF');
            system.debug('exception in mappingFieldDataVF : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    @AuraEnabled
    public static Map<String, String> mappingFieldData(String innerHTML, String recordId, String sourceObjectAPI){
        try {

            Map<String, String> returnValue = new Map<String, String>();

            List<String> allMappingKeyList = new List<String>();

            // Collect all related Object's field to verify that matching key are field Api or not?
            list<mappingObjects> objectWithFields = getFieldMappingKeys(sourceObjectAPI).fieldMappingsWithObj;
            for(mappingObjects obj : objectWithFields){
                for(Field_Label_Key field : obj.fieldMappings){
                    allMappingKeyList.add(field.name);
                }
            }


            // Define a regular expression pattern to match placeholders
            // Pattern pattern = Pattern.compile('\\{\\{\\?('+sourceObjectAPI+'\\..*?)\\}\\}');
            Pattern pattern = Pattern.compile('\\{\\{\\'+mappingSymbol+'(..*?)\\}\\}');
            // Create a matcher with the input string
            Matcher matcher = pattern.matcher(innerHTML);
            
            map<String, String> fieldApiVSKey = new map<String, String>();
            set<string> fieldApiList = new set<String>();

            fieldApiList.add('Id');                                                 // By default add these two field API...
            fieldApiList.add('Name');

            while (matcher.find()) {
                String fieldKey = matcher.group();
                String fieldAPI = matcher.group(1);                                  // Seperate Mapping Field Keyword from HTML String
                if(allMappingKeyList.contains(fieldAPI)){
                    fieldApiList.add(fieldAPI);
                    fieldApiVSKey.put(fieldAPI,  fieldKey);
                }
            }

            String fieldApiString = string.join(fieldApiList, ',');

            // Create Dynamic query and retrive object dynamically......
            String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM ' + sourceObjectAPI + ' WHERE Id = \''+ recordId +'\' LIMIT 1';
            system.debug('dynamicQuery : '+dynamicQuery);

            sObject sobj = Database.query(dynamicQuery);
            system.debug('getPopulatedFieldsAsMap(); '+ sobj.getPopulatedFieldsAsMap());

            String modifiedHTML = innerHTML;
            for(String fieldAPI : fieldApiList){
                System.debug('fieldKey : ' + fieldApiVSKey.get(fieldAPI));
                if(fieldApiVSKey.get(fieldAPI) != null){

                    String fieldValue = '';

                    if(fieldAPI.contains('.') == true){ //Means Related Object...
                        String relationshipName = fieldAPI.substringBefore('.');
                        String fieldName = fieldAPI.substringAfter('.');

                        // Get Related sObject value as a "Object"...
                        Object relatedObject = sobj.getPopulatedFieldsAsMap().get(relationshipName);
                        // Convert sObject value's Obejct in JSON as we can not get data without string...
                        // (here we have key as a string varibale not as a string)...
                        String relatedObjectString = JSON.serialize(relatedObject);
                        // Deseiralize Object as map of stirng and object so that we can fetch data based on map key...
                        Map<String, Object> relatedObjectValue = (Map<String, Object>) JSON.deserializeUntyped(relatedObjectString);

                        if(relatedObjectString != null){
                            fieldValue = (String)String.valueOf(relatedObjectValue.get(fieldName));         // Get record Value From Sobject....
                        }
                    }
                    else{
                        fieldValue = (String)String.valueOf(sobj.get(fieldAPI));         // Get record Value From Sobject....
                    }
                    if(fieldValue == null){
                        fieldValue = '';
                        modifiedHTML = modifiedHTML.replace(fieldApiVSKey.get(fieldAPI), fieldValue);   // Replace Mapping field with record value.....
                    }
                    else{
                        modifiedHTML = modifiedHTML.replace(fieldApiVSKey.get(fieldAPI), fieldValue);   // Replace Mapping field with record value.....
                    }
                }
            }

            returnValue.put('recordName', (String)sobj.get('Name'));
            returnValue.put('modifiedHTML', modifiedHTML);

            return returnValue;

        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'TemplateBuilderController', 'mappingFieldData');
            system.debug('exception in mappingFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    public class RetrunWrapper{
        @AuraEnabled public boolean isSuccess;
        @AuraEnabled public String returnMessage;
        @AuraEnabled public Obj_Label_API objectLabelAPI;
        @AuraEnabled public list<mappingObjects> fieldMappingsWithObj;
        @auraEnabled public Template__c template;
    }

    public class Obj_Label_API{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
    }

    public class mappingObjects{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
        @AuraEnabled public String fieldAPI;
        @auraEnabled public String objectLabel;
        @auraEnabled public String objectAPI;
        @AuraEnabled public list<Field_Label_Key> fieldMappings;
    }

    public class Field_Label_Key{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
        @AuraEnabled public String key;
    }

    public class relatedObjProperty{
        @auraEnabled public string parentObjFieldLabel;
        @auraEnabled public string parentObjRelationshipName;
        @auraEnabled public string parentObjFieldApi;
        @auraEnabled public string parentObjApi;
        @auraEnabled public boolean isCustome;
    }
}