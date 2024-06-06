public with sharing class KeyMappingController {

    public static string mappingSymbol = '#';
    public static string relatedObjKey = '{{#mappingKey}}';
    public static string generalFieldkeys = '{{Doc.mappingKey}}';
    public static string formattingKeys = '*formatKey*';

    @AuraEnabled
    public static retrunWrapper getFieldMappingKeys(String sourceObjectAPI){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try{
            list<MappingObjects> objWithFields = new list<MappingObjects>();

            Obj_Label_API objLabelAPI = new Obj_Label_API();
            String sourceObjectName = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().getName();
            String sourceObjectLabel = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().getLabel();
            objLabelAPI.name = sourceObjectName;
            objLabelAPI.label = sourceObjectLabel;


            // add base (self) object in Object List...
            List<Schema.DescribeFieldResult> objectField_self = getObjectFields(sourceObjectName);
            list<MappingFields> fieldMappingList_self = new list<MappingFields>();
            for(Schema.DescribeFieldResult field : objectField_self){
                if((String)String.valueOf(field.getType()) != 'ADDRESS' && (String)String.valueOf(field.getType()) != 'LOCATION'){
                    fieldMappingList_self.add(create_MappingField_Instance(field, '', 'objectFields'));
                }
            }
            MappingObjects mapObj_self = new MappingObjects();
            mapObj_self.label = sourceObjectLabel;
            mapObj_self.name = sourceObjectName;
            mapObj_self.objectAPI = sourceObjectName;
            mapObj_self.objectLabel = sourceObjectLabel;
            mapObj_self.fieldMappings = fieldMappingList_self;
            objWithFields.add(mapObj_self);

            // add related Object in Object list...
            List<RelatedObjInfo> relatedObjects = getRelatedObjects(sourceObjectAPI);
            for(RelatedObjInfo relatedObj : relatedObjects){
                list<MappingFields> fieldMappingList = new list<MappingFields>();

                // get Object Information...
                Schema.SObjectType sobjType = Schema.getGlobalDescribe().get(relatedObj.parentObjApi);
                String objLabel = sobjType.getDescribe().getLabel();
                String objName = relatedObj.parentObjApi;

                List<Schema.DescribeFieldResult> objectField = getObjectFields(relatedObj.parentObjApi);
                for(Schema.DescribeFieldResult field : objectField){
                    // Does not incluse Compound fields...
                    if((String)String.valueOf(field.getType()) != 'ADDRESS' && (String)String.valueOf(field.getType()) != 'LOCATION'){
                        fieldMappingList.add(create_MappingField_Instance(field, relatedObj.parentObjRelationshipName + '.', 'objectFields'));
                    }
                }

                MappingObjects mapObj = new MappingObjects();
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
            Log_Handler.store_Exception(e, 'KeyMappingController', 'getFieldMappingKeys');
            system.debug('exception in getFieldMappingKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    public static List<RelatedObjInfo> getRelatedObjects(String sourceObjectAPI) {
        try {
            Set<String> parentObjects = new Set<String>();
            List<RelatedObjInfo> relatedObjs = new List<RelatedObjInfo>();
            Map<String, Schema.SObjectField> mapOfFields = Schema.getGlobalDescribe().get(sourceObjectAPI).getDescribe().fields.getMap();
            for(String fieldName : mapOfFields.keySet()){
                Schema.SObjectField fieldObj = mapOfFields.get(fieldName);
                Schema.DescribeFieldResult field = fieldObj.getDescribe();
                if(field.getType() == Schema.DisplayType.REFERENCE){
                    // if(string.valueOf(field.getReferenceTo()[0]) != sourceObjectAPI){
                        RelatedObjInfo relatedObj = new RelatedObjInfo();
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
                    // } 
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
    public static RetrunWrapper getChildObjects(string sourceObjectAPI){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {
            list<MappingObjects> childObjs = new list<MappingObjects>();

            Schema.SObjectType sobjType = Schema.getGlobalDescribe().get(sourceObjectAPI);
            Schema.DescribeSObjectResult sourceObj = sobjType.getDescribe();
            List<Schema.ChildRelationship> childObjects = sourceObj.getChildRelationships();
            for(Schema.ChildRelationship child :  childObjects){
                if(child.getRelationshipName() != null){
                    Schema.DescribeSObjectResult childObj = child.getChildSObject().getDescribe();
                    Schema.DescribeFieldResult childField = child.getField().getDescribe();
    
                    MappingObjects childObject = new MappingObjects();
                    childObject.label = childObj.getLabel();
                    childObject.name = childObj.getName();
                    childObject.objectAPI =  childObj.getName() + ' < ' + childField.getName();
                    childObject.objectLabel = childObj.getLabel();
                    childObject.additionalInfo = childField.getLabel() + ' ('+ childField.getName() +')';
                    childObjs.add(childObject);
                }

            }

            retrunWrapper.isSuccess = true;
            retrunWrapper.fieldMappingsWithObj = childObjs;
            return retrunWrapper;

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'getChildObjects');

            system.debug('exception in getChildObjects : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            retrunWrapper.isSuccess = false;

            return retrunWrapper;
        }
    }

    @AuraEnabled
    public static RetrunWrapper getGeneralFields(){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {

            list<MappingObjects> customObj = new list<MappingObjects>();

            // create mapping for document creation Dates...
            customObj.add(getCreationDateMappings());

            MappingObjects userObject = new MappingObjects();
            userObject.label = 'User Deatils';
            userObject.name = 'runtimeUser';
            list<MappingFields> userObjFields = new list<MappingFields>();
            List<Schema.DescribeFieldResult> userObjFields_schema = getObjectFields('User');
            for(Schema.DescribeFieldResult f : userObjFields_schema){
                if((String)String.valueOf(f.getType()) != 'ADDRESS' && (String)String.valueOf(f.getType()) != 'LOCATION'){
                    MappingFields field = create_MappingField_Instance(f, 'User.', 'generalFields');
                    userObjFields.add(field);
                }
            }
            userObject.fieldMappings = userObjFields;
            customObj.add(userObject);

            MappingObjects organizationObject = new MappingObjects();
            organizationObject.label = 'Organization Deatils';
            organizationObject.name = 'organization';
            list<MappingFields> organization = new list<MappingFields>();
            List<Schema.DescribeFieldResult> organizationObjFields_schema = getObjectFields('Organization');
            for(Schema.DescribeFieldResult f : organizationObjFields_schema){
                if((String)String.valueOf(f.getType()) != 'ADDRESS' && (String)String.valueOf(f.getType()) != 'LOCATION'){
                    MappingFields field = create_MappingField_Instance(f, 'Org.', 'generalFields');
                    organization.add(field);
                }
            }
            organizationObject.fieldMappings = organization;
            customObj.add(organizationObject);

            retrunWrapper.isSuccess = true;
            retrunWrapper.fieldMappingsWithObj = customObj;
            return retrunWrapper;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'getGeneralFields');

            system.debug('exception in getGeneralFields : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }
    public static MappingObjects getCreationDateMappings(){
        MappingObjects dateMapping = new MappingObjects();
        dateMapping.label = 'Dates';
        dateMapping.name = 'runtimeDates';
        try {

            list<MappingFields> dateFields = new list<MappingFields>();

            map<string, string> dateFormats = dateFormats();

            for(string dateInfo : dateFormats.keySet()){
                string fieldName = 'Date.'+dateInfo;
                string fieldKey = generalFieldkeys.replace('mappingKey', 'Date.'+dateInfo);
                String fieldLabel = dateFormats.get(dateInfo).split('; ')[0];
                String fieldType = dateFormats.get(dateInfo).split('; ')[1];
                String isFormatReq = dateFormats.get(dateInfo).split('; ')[2];

                MappingFields fieldMapping = new MappingFields();
                fieldMapping.label = fieldLabel;
                fieldMapping.name = fieldName;
                fieldMapping.key = fieldKey;
                fieldMapping.type = fieldType;
                fieldMapping.isFormatReq = Boolean.valueOf(isFormatReq);

                dateFields.add(fieldMapping);
            }

            dateMapping.fieldMappings = dateFields;
            return dateMapping;
        } catch (Exception e) {
            system.debug('exception in getCreationDateMappings : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return dateMapping;
        }
    }

    public static map<string, string> dateFormats(){
        datetime cTime = datetime.now();

        map<string, string> dateFormats = new map<string, string>{
            // 'key' => 'label; fieldType; isFormatReq; value'
            'date'      => 'Document Creation Date & Time; DATETIME; true; ' + cTime.format('yyyy-MM-dd hh:mm:ss'),
            'time'      => 'Document Creation Time; TIME; true; ' + cTime.format('HH:mm:ss'),
            'Wday'      => 'Document Creation Week Day; INTEGER; false; ' + cTime.format('F'),
            'Mday'      => 'Document Creation Month Day; INTEGER; false; ' + cTime.format('dd'),
            'Yday'      => 'Document Creation Year Day; INTEGER; false; ' + cTime.format('DDD'),
            'WdayName'  => 'Document Creation Week Day Name; STRING; true; ' + cTime.format('EEEEE'),
            'month'     => 'Document Creation Month; INTEGER; false; '+ cTime.format('MM'),
            'monthName' => 'Document Creation Month Name; STRING; true; '+ cTime.format('MMMMM'),
            'Year'      => 'Document Creation Year; STRING; true; '+ cTime.format('yyyy')
        };

        return dateFormats;      
    }

    @AuraEnabled
    public static RetrunWrapper getMerginTemplateKeys(){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {
            List<Template__c> activeTemps = [SELECT Id, Name, Template_Name__c FROM Template__c WHERE Template_Status__c = true AND Template_Type__c IN ('Simple Template', 'Google Doc Template')];
            if(activeTemps != null){
                list<MappingObjects> fieldMappingsWithObj = new list<MappingObjects>();
                MappingObjects mergeTemps = new MappingObjects();
                list<MappingFields> fieldMappings = new list<MappingFields>();
                mergeTemps.name = 'Merge Tempaltes';
                mergeTemps.name = 'megreTempaltes';
                for(Template__c temp : activeTemps){
                    MappingFields tempKeys = new MappingFields();
                    tempKeys.label = temp.Template_Name__c;
                    tempKeys.name = temp.Id;
                    tempKeys.key = generalFieldkeys.replace('mappingKey', 'Temp.'+ temp.Id +' '+ formattingKeys.replace('formatKey', temp.Template_Name__c));
                    fieldMappings.add(tempKeys);
                }
                mergeTemps.fieldMappings = fieldMappings;
                fieldMappingsWithObj.add(mergeTemps);
                retrunWrapper.fieldMappingsWithObj = fieldMappingsWithObj;
            }
            else{
                retrunWrapper.returnMessage = 'There is No Active Tempale Avalibale To Merge';
            }

            retrunWrapper.isSuccess = true;
            return retrunWrapper;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'getMerginTemplateKeys');

            system.debug('exception in getMerginTemplateKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    @AuraEnabled
    public static RetrunWrapper getAllContentVersionImgs(){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {

            List<string> imgTyes = new List<string>{'png',' jpg',' jpeg',' gif',' svg',' avif',' webp',' heic',' ico',' jfif',' jps',' jpe', 'svg'};
            List<ContentVersion> allImgCV = [SELECT Id, Title, FileExtension, FileType, VersionDataUrl, ContentSize, IsLatest FROM ContentVersion WHERE FileExtension IN: imgTyes AND IsLatest = true];

            if(allImgCv.size() > 0){
                retrunWrapper.cvImages = allImgCV;
                retrunWrapper.isSuccess = true;
            }
            else{
                retrunWrapper.returnMessage = 'zero_imgs';
                retrunWrapper.isSuccess = false;
            }
            return retrunWrapper;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'getMerginTemplateKeys');
            system.debug('exception in getMerginTemplateKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    public static MappingFields create_MappingField_Instance(Schema.DescribeFieldResult field, string parentObjKey, string mappingType){
        try {
            String fieldKey = '';
            if(mappingType == 'objectFields'){
                fieldKey = relatedObjKey.replace('mappingKey', parentObjKey+field.getName());
            }
            else if(mappingType == 'generalFields'){
                fieldKey = generalFieldkeys.replace('mappingKey', parentObjKey+field.getName());
            }

            MappingFields fieldMapping = new MappingFields();
            fieldMapping.label = (String)String.valueOf(field.getLabel());
            fieldMapping.name = parentObjKey + (String)String.valueOf(field.getName());
            fieldMapping.key = fieldKey;

            String fieldType = (String)String.valueOf(field.getType());
            fieldMapping.type = fieldType;

            if( fieldType == 'DATE' || fieldType == 'DATETIME' || fieldType == 'BOOLEAN' || fieldType == 'STRING' || 
                fieldType == 'INTEGER' || fieldType == 'DOUBLE' || fieldType == 'CURRENCY' || fieldType == 'PERCENT'){
                fieldMapping.isFormatReq = true;
            }
            else { 
                fieldMapping.isFormatReq = false; 
            }

            // fieldMapping.isSearchable = field.isFilterable();

            return fieldMapping;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'create_MappingField_Instance');
            system.debug('exception in create_MappingField_Instance : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }

    @AuraEnabled
    public static RetrunWrapper formattingFieldKeys(){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {

            list<FormattingField> listOFformattingField = new list<FormattingField>();

            FormattingField dateFormatting = new FormattingField();
            map<string, string> dateFormats = new map<string, string>{
                'dd/MM/yyyy' => 'DD/MM/YYYY (31/12/2023)',
                'dd/MM/yy' => 'DD/MM/YYYY (31/12/23)',
                'MM/dd/yyyy' => 'MM/DD/YYYY (12/31/23)',
                'MM/dd/yy' => 'MM/DD/YY (12/31/23)',
                'yyyy/MM/dd' => 'YYYY/MM/DD (2023/12/31)',
                'dd MMMM yyyy' => 'DD Month 2023 (31 December 2023)',
                'dd MMM yyyy' => 'DD Mon YYYY (31 Dec 2023)',
                'dd MMMM, yyyy' => 'DD Month, YYYY (31 December, 2023)',
                'dd MM, yyyy' => 'DD Mon, YYYY (31 Dec, 2023)',
                'MMMM dd, yyyy' => 'Month DD, YYYY (December 31, 2023)',
                'MMM dd, yyyy' => 'Mon DD, YYYY (December 31, 23)',
                'yyyy, MMMM dd' => 'YYYY, Month DD (2023, December 31)',
                'yyyy, MM dd' => 'YYYY, Mon DD (2023, December 31)'
            };
            dateFormatting.formatType = 'DATE';
            list<MappingFields> MappingFields = new list<MappingFields>();
            for(string formatType : dateFormats.keyset()){
                MappingFields dateFormat = new MappingFields();
                dateFormat.label = dateFormats.get(formatType);
                dateFormat.name = formatType;
                dateFormat.formatKey = formattingKeys.replace('formatKey', formatType);
                MappingFields.add(dateFormat);
            }
            dateFormatting.fieldMappings = MappingFields;
            listOFformattingField.add(dateFormatting);

            FormattingField timeFormatting = new FormattingField();
            map<String, String> timeFormats = new map<String, String>{
                'HH:mm:ss' => 'HH:mm:ss (12:59:00)',
                'HH:mm' => 'HH:mm (12:59)',
                'HH' => 'HH (12)',
                'mm' => 'mm (59)',
                'ss' => 'ss (00)',
                'hh:mm:ss aaa' => 'hh:mm:ss aaa (12:59:00 PM)',
                'hh:mm aaa' => 'hh:mm aaa (12:59 PM)'
            };
            timeFormatting.formatType = 'TIME';
            list<MappingFields> mappingFields2 = new list<MappingFields>();
            for(string formatType : timeFormats.keyset()){
                MappingFields timeFormat = new MappingFields();
                timeFormat.label = timeFormats.get(formatType);
                timeFormat.name = formatType;
                timeFormat.formatKey = formattingKeys.replace('formatKey', formatType);
                mappingFields2.add(timeFormat);
            }
            timeFormatting.fieldMappings = mappingFields2;
            listOFformattingField.add(timeFormatting);

            retrunWrapper.isSuccess = true;
            retrunWrapper.fieldFormatting = listOFformattingField;
            return retrunWrapper;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilder_Controller', 'formattingFieldKeys');
            system.debug('exception in formattingFieldKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            retrunWrapper.isSuccess = false;
            retrunWrapper.returnMessage = e.getMessage();
            return retrunWrapper;
        }
    }

    // === ==== Replace mapping with actual data methods --- START ---- ==== ====
    public static Map<String, String> mappingFieldDataVF(String templateID, String recordId, String sourceObjectAPI){
        try {

            Map<String, String> returnValue = new Map<String, String>();
            String recordName = '';

            String innerHTML = '';
            String modifiedHTML = '';

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c ASC)
                                FROM Template__c WHERE Id =: templateID LIMIT 1];

            if(temp.size() > 0){
                for(Template_Data__c fieldValue : temp[0].Template_Data__r){
                    innerHTML += fieldValue.Template_Value_Simple__c;
                }
            }

            innerHTML = innerHTML.replace('&nbsp;', ' ');

            modifiedHTML = innerHTML;
            
            modifiedHTML = mappingObjFieldsData(modifiedHTML, recordId, sourceObjectAPI);
            modifiedHTML = mappingGeneralFieldData(modifiedHTML);
            modifiedHTML = mappingMergeTemplate(modifiedHTML);
            
            // ... Get Record Name ...
            sObject sobj1 = Database.query('SELECT Id, Name FROM '+ sourceObjectAPI + ' WHERE Id = \''+ recordId +'\' LIMIT 1');
            recordName = (String)sobj1.get('Name');
            returnValue.put('recordName', recordName);
            
            returnValue.put('modifiedHTML', modifiedHTML);
            return returnValue;

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'KeyMappingController', 'mappingFieldDataVF');
            system.debug('exception in mappingFieldDataVF : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }
        // --- Source Object and Related Object field Mapping -- START ---
    @AuraEnabled
    public static String mappingObjFieldsData(String innerHTML, String recordId, String sourceObjectAPI){
        try {

            Map<String, String> valid_fieldAPI_vs_fieldType = new Map<String, String>();

            // Collect all related Object's field to verify that matching key are field Api or not?
            list<MappingObjects> objectWithFields = getFieldMappingKeys(sourceObjectAPI).fieldMappingsWithObj;
            for(MappingObjects obj : objectWithFields){
                for(MappingFields field : obj.fieldMappings){
                    valid_fieldAPI_vs_fieldType.put(field.name, field.type);
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern objMapPattern = Pattern.compile('\\{\\{\\'+mappingSymbol+'(..*?)\\}\\}');

            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, valid_fieldAPI_vs_fieldType, objMapPattern);

            String fieldApiString = string.join(extractedFields.fieldApiList, ',');

            // Create Dynamic query and retrive object dynamically......
            String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM ' + sourceObjectAPI + ' WHERE Id = \''+ recordId +'\' LIMIT 1';
            system.debug('dynamicQuery : '+dynamicQuery);

            sObject sobj = Database.query(dynamicQuery);
            system.debug('getPopulatedFieldsAsMap(); '+ sobj.getPopulatedFieldsAsMap());

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKey_vs_name.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                extractedFields.sobj = sobj;
                modifiedHTML = mapObjRecordValues(extractedFields, mappingKey);
            }

            return modifiedHTML;
        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'KeyMappingController', 'mappingObjFieldsData');
            system.debug('exception in mappingObjFieldsData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }
    public static String mapObjRecordValues(ExtractedMappings extractedFields, String mappingKey){
        try {

            String fieldAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
            String fieldKey = mappingKey;
            String formatType = extractedFields.mappingKey_vs_format.get(mappingKey);
            String fieldType = extractedFields.mappingKey_vs_type.get(mappingKey);

            String fieldValue = '';
            String userTimeZone = (String)String.valueOf(UserInfo.getTimeZone().getID());

            if(fieldAPI.contains('.') == true){ //Means Related Object...
                String relationshipName = fieldAPI.substringBefore('.');
                String fieldName = fieldAPI.substringAfter('.');

                // Get Related sObject value as a "Object"...
                Object relatedObject = extractedFields.sobj.getPopulatedFieldsAsMap().get(relationshipName);
                // Convert sObject value's Obejct in JSON as we can not get data without string...
                // (here we have key as a string varibale not as a string)...
                String relatedObjectString = JSON.serialize(relatedObject);
                // Deseiralize Object as map of stirng and object so that we can fetch data based on map key...
                Map<String, Object> relatedObjectValue = (Map<String, Object>) JSON.deserializeUntyped(relatedObjectString);

                if(relatedObjectValue != null){
                    fieldValue = (String)String.valueOf(relatedObjectValue.get(fieldName));         // Get record Value From Sobject....
                }
            }
            else{
                fieldValue = (String)String.valueOf(extractedFields.sobj.get(fieldAPI));         // Get record Value From Sobject....
            }

            if(formatType != null && fieldValue != '' && fieldValue != null){
                // field required formatting...
                if(fieldType == 'DATETIME' || fieldType == 'DATE'){
                    fieldValue = formatDateTime(fieldValue, formatType);
                }
                if(fieldType == 'BOOLEAN'){
                    fieldValue = formatBoolean(fieldValue, formatType);
                }
                if(fieldType == 'STRING'){
                    fieldValue = formatString(fieldValue, formatType);
                }
                if( fieldType == 'INTEGER' || fieldType == 'DOUBLE' || 
                    fieldType == 'CURRENCY' || fieldType == 'PERCENT'){
                        fieldValue = formatNumber(fieldValue, formatType);
                }
            }

            if(fieldValue == null){
                fieldValue = '';
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }
            else{
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }
            

            return extractedFields.modifiedHTML;
        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'KeyMappingController', 'mapObjRecordValues');
            system.debug('exception in mapObjRecordValues : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            System.debug('error to map key : '+ mappingKey);
            return extractedFields.modifiedHTML;
        }
    }
        // --- Source Object and Related Object field Mapping -- END ---

    public static string mappingGeneralFieldData(String innerHTML){
        try {

            Map<String, String> valid_fieldAPI_vs_fieldType = new Map<String, String>();

            // Collect all general field to verify that matching key are valid or not?
            list<MappingObjects> objectWithFields = getGeneralFields().fieldMappingsWithObj;
            for(MappingObjects obj : objectWithFields){
                for(MappingFields field : obj.fieldMappings){
                    valid_fieldAPI_vs_fieldType.put(field.name, field.type);
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern generalFieldPattern = Pattern.compile('\\{\\{Doc\\.(..*?)\\}\\}');

            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, valid_fieldAPI_vs_fieldType, generalFieldPattern);

            set<string> mappedDateField = new set<string>();
            set<string> mappedUserField = new set<string>();
            set<string> mappedOrgField = new set<string>();

            for(string mappingKey : extractedFields.mappingKey_vs_name.keyset()){
                String mappingAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Date'){
                    mappedDateField.add(mappingAPI.substringAfter('.'));
                }
                else if(mappingAPI.substringBefore('.') == 'User'){
                    mappedUserField.add(mappingAPI.substringAfter('.'));
                }
                else if(mappingAPI.substringBefore('.') == 'Org'){
                    mappedOrgField.add(mappingAPI.substringAfter('.'));
                }
            }

            sObject userObj;
            if(mappedUserField.size() > 0){
                String userId = UserInfo.getUserId();
                String fieldApiString = string.join(mappedUserField, ',');
                String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM User WHERE Id = \''+ userId +'\' LIMIT 1';
                system.debug('dynamicQuery : '+dynamicQuery);

                userObj = Database.query(dynamicQuery);
            }

            sObject orgObj;
            if(mappedOrgField.size() > 0){
                String orgId = UserInfo.getOrganizationId();
                String fieldApiString = string.join(mappedOrgField, ',');
                String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM Organization WHERE Id = \''+ orgId +'\' LIMIT 1';
                system.debug('dynamicQuery : '+dynamicQuery);

                orgObj = Database.query(dynamicQuery);
            }

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKey_vs_name.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                String mappingAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Date'){
                    extractedFields.sObj = null;
                    extractedFields.keyVSdata = dateFormats();
                }
                else if(mappingAPI.substringBefore('.') == 'User'){
                    extractedFields.sObj = userObj;
                    extractedFields.keyVSdata = null;
                }
                else if(mappingAPI.substringBefore('.') == 'Org'){
                    extractedFields.sObj = orgObj;
                    extractedFields.keyVSdata = null;
                }

                modifiedHTML = mapGeneralFieldNTempData(extractedFields, mappingKey);
            }

            return modifiedHTML;
        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }

    public static string mappingMergeTemplate(String innerHTML){
        try {

            Map<String, String> valid_fieldAPI_vs_fieldType = new Map<String, String>();

            list<Template__c> allTemps = [SELECT Id FROM Template__c];
            if(allTemps.size() > 0){
                for(Template__c temp : allTemps){
                    valid_fieldAPI_vs_fieldType.put('Temp.'+ temp.Id, 'NONE');
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern margeTempPattern = Pattern.compile('\\{\\{Doc\\.(..*?)\\}\\}');
            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, valid_fieldAPI_vs_fieldType, margeTempPattern);

            set<string> mergeTempIds = new set<string>();

            for(string mappingKey : extractedFields.mappingKey_vs_name.keyset()){
                String mappingAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Temp'){
                    mergeTempIds.add(mappingAPI.substringAfter('.'));
                }
            }

            map<String, String> tempId_vs_tempData = new map<String, String>();
            if(mergeTempIds.size() > 0){
                list<Template__c> templatesToMerge = [SELECT Id, Template_Name__c, Template_Type__c, Template_Status__c,
                                        (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c ASC )
                                        FROM Template__c WHERE Id IN: mergeTempIds];

                if(templatesToMerge.size() > 0){
                    for(Template__c temp : templatesToMerge){
                        string tempValue = '';
                        if(temp.Template_Type__c == 'Simple Template' || temp.Template_Type__c == 'Google Doc Template'){
                            if(temp.Template_Status__c == true){
                                for(Template_Data__c tempData : temp.Template_Data__r){
                                    tempValue += tempData.Template_Value_Simple__c;
                                }
                            }
                            else{
                                tempValue = generalFieldkeys.replace('mappingKey', 'Temp.'+ temp.Id +' '+ formattingKeys.replace('formatKey', temp.Template_Name__c) +' <span style="color: red;"> -- Inactive Template -- </span>');
                            }
                            tempId_vs_tempData.put(temp.Id, tempValue);

                        }
                        else if(temp.Template_Type__c == 'CSV Template'){
                            tempValue = generalFieldkeys.replace('mappingKey', 'Temp.'+ temp.Id +' '+ formattingKeys.replace('formatKey', temp.Template_Name__c) +' <span style="color: red;"> -- CSV Template Can not be merge -- </span>');
                            tempId_vs_tempData.put(temp.Id, tempValue);
                        }

                    }
                }
            }

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKey_vs_name.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                String mappingAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Temp'){
                    extractedFields.sObj = null;
                    extractedFields.keyVSdata = tempId_vs_tempData;
                }

                modifiedHTML = mapGeneralFieldNTempData(extractedFields, mappingKey);
            }

            return modifiedHTML;

        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }

    // -- Generic methods for mapping functionality ----
    public static ExtractedMappings extractMappingKeys(String innerHTML,  Map<String, String> valid_fieldAPI_vs_fieldType, Pattern pattern){
        ExtractedMappings extractedFields = new ExtractedMappings();
        try {            
            // Create a matcher with the input string
            Matcher matcher = pattern.matcher(innerHTML);
            
            set<string> fieldApiList = new set<String>();

            map<String, String> mappingKey_vs_name = new map<String, String>();       // This mpa use to get field name by mappingKey...
            map<String, String> mappingKey_vs_format = new map<String, String>();    // This mpa use to get field format by mappingKey...
            map<String, String> mappingKey_vs_type = new map<String, String>();       // This mpa use to get field type by mappingKey...

            while (matcher.find()) {
                String fieldKey = matcher.group();
                String fieldAPI = matcher.group(1);      // Seperate Mapping Field Keyword from HTML String

                // Check fieldAPI inside mapping key is valid or not...
                if(valid_fieldAPI_vs_fieldType.get(fieldAPI) == null){
                    // if fieldType is null, it meanse Key is not vaild or key consist formatting key...

                    String fKey = fieldAPI.substringBetween('*');
                    if(fKey != null){
                        // fieldAPI Consist  string between *, it meanse fieldKey consist formatting key...
                        // ** here we need to check if formatting key in valid key or not .. pending ...

                        string formattingKey = '*'+fKey+'*';
                        string format = fKey;
                        string fAPI = fieldAPI.replace(formattingKey, '').trim();      // remove text with ** and space, we will find fieldAPI..

                        // after seperate formatKey... Again check fieldAPI inside mapping key is valid or not...
                        if(valid_fieldAPI_vs_fieldType.get(fAPI) != null){
                            fieldApiList.add(fAPI);
    
                            mappingKey_vs_name.put(fieldKey,  fAPI);
                            mappingKey_vs_format.put(fieldKey,  format);
                            mappingKey_vs_type.put(fieldKey,  valid_fieldAPI_vs_fieldType.get(fAPI));
                        }
                    }

                }
                else{
                    // fieldAPI of mapping key is valid....
                    fieldApiList.add(fieldAPI);

                    mappingKey_vs_name.put(fieldKey,  fieldAPI);
                    mappingKey_vs_format.put(fieldKey,  null);
                    mappingKey_vs_type.put(fieldKey,  valid_fieldAPI_vs_fieldType.get(fieldAPI));
                }
            }

            extractedFields.fieldApiList = new List<String>(fieldApiList);
            extractedFields.mappingKey_vs_name = mappingKey_vs_name;
            extractedFields.mappingKey_vs_format = mappingKey_vs_format;
            extractedFields.mappingKey_vs_type = mappingKey_vs_type;
            
            return extractedFields;
        } catch (Exception e) {
            system.debug('exception in extractMappingKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return extractedFields;
        }
    }
    public static string mapGeneralFieldNTempData(ExtractedMappings extractedFields, String mappingKey){
        try {

            String mappingAPI = extractedFields.mappingKey_vs_name.get(mappingKey);
            String fieldKey = mappingKey;
            String formatType = extractedFields.mappingKey_vs_format.get(mappingKey);
            String fieldType = extractedFields.mappingKey_vs_type.get(mappingKey);

            String fieldValue = '';

            String generalFieldType = mappingAPI.substringBefore('.');
            String fieldAPI = mappingAPI.substringAfter('.');

            if(generalFieldType == 'Date'){
                fieldValue = extractedFields.keyVSdata.get(fieldAPI).split('; ')[3];
            }
            else if(generalFieldType == 'User' || generalFieldType == 'Org'){
                if( extractedFields.sobj != null){
                    fieldValue = (String)String.valueOf(extractedFields.sobj.get(fieldAPI));         // Get record Value From Sobject....
                }
            }
            else if(generalFieldType == 'Temp'){
                fieldValue = extractedFields.keyVSdata.get(fieldAPI);
            }

            if(formatType != null && fieldValue != '' && fieldValue != null){
                // field required formatting...
                if(fieldType == 'DATETIME' || fieldType == 'DATE'){
                    fieldValue = formatDateTime(fieldValue, formatType);
                }
                if(fieldType == 'BOOLEAN'){
                    fieldValue = formatBoolean(fieldValue, formatType);
                }
                if(fieldType == 'STRING'){
                    fieldValue = formatString(fieldValue, formatType);
                }
                if( fieldType == 'INTEGER' || fieldType == 'DOUBLE' || 
                    fieldType == 'CURRENCY' || fieldType == 'PERCENT'){
                        fieldValue = formatNumber(fieldValue, formatType);
                }
            }

            if(fieldValue == null){
                fieldValue = '';
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }
            else{
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }

            return extractedFields.modifiedHTML;
        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return extractedFields.modifiedHTML;
        }
    }
    public static string formatDateTime(string fieldValue, string formatType){
        String userTimeZone = (String)String.valueOf(UserInfo.getTimeZone().getID());
        Datetime dt = Datetime.valueOfGMT(fieldValue);

        fieldValue = dt.format(formatType, userTimeZone);

        return fieldValue;
    }
    public static string formatBoolean(string fieldValue, string formatType){
        fieldValue = fieldValue == 'true' ? formatType.substringBefore('/') : formatType.substringAfter('/');

        return fieldValue;
    }
    public static string formatString(string fieldValue, string formatType){
        Integer endIndex = (Integer) Integer.valueOf(formatType.substringAfter('L:'));
        endIndex = endIndex > fieldValue.length() ? fieldValue.length() : endIndex;             // endIndex must be less than value string length...
        fieldValue = fieldValue.substring(0, endIndex);

        return fieldValue;
    }
    public static string formatNumber(string fieldValue, string formatType){
        Decimal val = (Decimal) Decimal.valueOf(fieldValue);
        String format = formatType.substringBetween('F:', ',');
        String decimalPlaces = formatType.substringBetween('dP:', ',');
        String roundMode = formatType.substringBetween('rM:', ',');

        if(decimalPlaces != null){
            if(roundMode != null){
                System.RoundingMode rM = System.RoundingMode.valueOf(roundMode);
                val = val.setScale(Integer.valueOf(decimalPlaces), rM);
            }
            else{
                val = val.setScale(Integer.valueOf(decimalPlaces));
            }
        }

        if(format == 'yes'){
            fieldValue = val.format();

            // Standard format() method remove decimal if user did't set any decimal places at time of field creation...
            // So, when decimalPlaces is not 0, add decimal from our end as per formatKey...
            if(decimalPlaces != null && decimalPlaces != '0'){
                string valStr = (String) String.valueOf(val);
                String decimalValue = (String) String.valueOf(valStr.substringAfter('.'));
                if(fieldValue.contains('.')){
                    // when fieldValue contains any decimals..., remove standard decimal palces and add custom decimal palces...
                    fieldValue = val.format().substringBefore('.') + '.'+ decimalValue;
                }
                else{
                    // when fieldValue not contains any decimals...
                    fieldValue = val.format() + '.'+ decimalValue;
                }
            }

        }
        else{
            fieldValue = String.valueOf(val);
        }

        return fieldValue;
    }
    // === ==== Replace mapping with actual data methods --- END ---- ==== ====

    public class RetrunWrapper{
        @AuraEnabled public boolean isSuccess;
        @AuraEnabled public String returnMessage;
        @AuraEnabled public Obj_Label_API objectLabelAPI;
        @AuraEnabled public list<MappingObjects> fieldMappingsWithObj;
        @auraEnabled public Template__c template;
        @auraEnabled public List<ContentVersion> cvImages;
        @auraEnabled public list<FormattingField> fieldFormatting;
     }

    public class Obj_Label_API{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
    }

    public class MappingObjects{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
        @AuraEnabled public String fieldAPI;
        @auraEnabled public String objectLabel;
        @auraEnabled public String objectAPI;
        @auraEnabled public String additionalInfo;
        @AuraEnabled public list<MappingFields> fieldMappings;
    }

    public class MappingFields{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
        @AuraEnabled public String key;
        @AuraEnabled public String type;
        @AuraEnabled public String formatKey;
        @AuraEnabled public Boolean isSearchable;
        @AuraEnabled public Boolean isFormatReq;
        @AuraEnabled public Boolean isDate;
        @AuraEnabled public Boolean isDateTime;
        @AuraEnabled public Boolean isCheckbox;
        @AuraEnabled public Boolean isPhone;
        @AuraEnabled public Boolean isURL;
    }

    public class RelatedObjInfo{
        @auraEnabled public string parentObjFieldLabel;
        @auraEnabled public string parentObjRelationshipName;
        @auraEnabled public string parentObjFieldApi;
        @auraEnabled public string parentObjApi;
        @auraEnabled public boolean isCustome;
    }

    public class FormattingField{
        @AuraEnabled public string formatType;
        @AuraEnabled public list<MappingFields> fieldMappings;
    }

    public class ExtractedMappings{
        @AuraEnabled public List<string> fieldApiList;
        @AuraEnabled public map<String, String> mappingKey_vs_name;
        @AuraEnabled public map<String, String> mappingKey_vs_format;
        @AuraEnabled public map<String, String> mappingKey_vs_type;
        @AuraEnabled public String modifiedHTML;
        @AuraEnabled public sObject sobj;
        @AuraEnabled public map<String, String> keyVSdata;
    }
}