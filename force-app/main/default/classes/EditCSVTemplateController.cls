public with sharing class EditCSVTemplateController {
    // -=-=- this method is used to get the Fields for a perticular template object only -=-=- 
/*
*********************************************************
@description    : Method is used to fetch all the fields of the object
@param objName  : {String} - name of the object
@return         : List<FieldInfoWrapper> - including field Label, Api name, Field Type and Picklist values if it has 
********************************************************
*/
    @AuraEnabled(cacheable = true)
    public static List<FieldInfoWrapper> getFields(String objName) {
        List<FieldInfoWrapper> allFields = new List<FieldInfoWrapper>();
        try{
            System.debug('Object Name ::: ' + objName);
            Map<String, Schema.SObjectField> M_Objects_Schema_Field = Schema.getGlobalDescribe().get(objName).getDescribe().fields.getMap();
            for( String a_Field_Name : M_Objects_Schema_Field.keySet() ) {
                FieldInfoWrapper field = new FieldInfoWrapper();
                Schema.DescribeFieldResult a_Field_Description = M_Objects_Schema_Field.get( a_Field_Name ).getDescribe();
                field.apiName = a_Field_Description.getName();
                field.fieldName = a_Field_Description.getLabel();
                field.fieldType = String.valueOf(a_Field_Description.getType());
                field.isSearchable = a_Field_Description.isFilterable();

                // Check if the field is a picklist
                if(a_Field_Description.getType() == Schema.DisplayType.PICKLIST) {
                    // Get picklist values
                    List<String> picklistValues = new List<String>();
                    Schema.PicklistEntry[] picklistEntries = a_Field_Description.getPicklistValues();
                    if(picklistEntries != null && picklistEntries.size() > 0) {
                        for(Schema.PicklistEntry entry : picklistEntries) {
                            picklistValues.add(entry.getLabel());
                        }
                    }
                    // Add picklist values to the field wrapper
                    field.picklistValues = picklistValues;
                } else {
                    // For non-picklist fields, set picklist values to null
                    field.picklistValues = null;
                }            
    
                allFields.add(field);
            }
    
            System.debug('All Fields are :: ' + allFields);
        }catch(Exception e){
            Log_Handler.store_Exception(e, 'EditCSVTemplateController', 'getFields');
        }
        return allFields;
    }


    // -=-=- This method is used for to get the Template fields records if there are any for any template -=-=- 
/*
*********************************************************
@description     : Method is used to fetch data from the template fields records associated with template (if there are any)
@param templateId: {String} - Id of the current  template
@return          : templateDataWrapper - including the Selected Fields and the custom Separator Separated Filters String
********************************************************
*/
    @AuraEnabled
    public static templateDataWrapper getTemplateFieldsData(String templateId){
        templateDataWrapper allData = new templateDataWrapper();
        allData.fields = '';
        allData.filters = '';
        try {
            List<Template_Fields__c> tf = new List<Template_Fields__c>([SELECT Id, CSV_Fields__c, CSV_Filter__c, CSV_Query__c, Template_Page__c FROM Template_Fields__c WHERE Template__c =:templateId ORDER BY Order_No_Simple__c asc NULLS Last]);
            System.debug('Template : ' + templateId);
            // tf.addAll([SELECT Id, CSV_Fields__c, CSV_Filter__c, CSV_Query__c FROM Template_Fields__c  WHERE Template__c =:templateId ORDER BY Order_No_Simple__c asc NULLS Last]);

            if(tf.size() >0){
                for (Template_Fields__c t : tf) {
                    if(t.CSV_Filter__c != null){
                        allData.filters += t.CSV_Filter__c;
                    }
                    // System.debug('filter data String :: ' + tf.CSV_Filter__c);
                }
                allData.fields = tf[0].CSV_Fields__c;
            }
            // for(Template_Fields__c t : tf){
            //     if(t.CSV_Filter__c != null){
            //         allData.filters += t.CSV_Filter__c;
            //     }
            // }
            System.debug('Template Fields Data Fetched: ' + allData);
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'EditCSVTemplateController', 'getTemplateField');
        }
        return allData;
    }
    
/*
*********************************************************
@description    : Method is used to save all the Selected fields and the filters on the template fields associated with the selected template
@param allFields   : {String} - name of the object
@param templateId  : {String} - Id of the current template
@param query       : {String} - Generated query string based on the Selections
@param filters     : {String} - Generated Custom separator separated String, to store all sorts, filters, logic and Limit
@return         : (Nothing will be returned)
********************************************************
*/
    @AuraEnabled
    public static void saveTemplateFields(String allFields, String templateId, String query, String filters){
        try {
            List<Template_Fields__c> existingFields = new List<Template_Fields__c>([SELECT Id, CSV_Fields__c, CSV_Filter__c, CSV_Query__c, Template_Page__c FROM Template_Fields__c WHERE Template__c =:templateId ORDER BY Order_No_Simple__c asc NULLS Last]);
            List<Template_Page__c> existingPage = new List<Template_Page__c>([SELECT Id FROM Template_Page__c WHERE Template__c =:templateId]);
            List<String> filterParts = new List<String>();

            System.debug('Fields : ' + allFields);
            System.debug('Template : ' + templateId);
            System.debug('Fields Count :: ' + existingFields.size());
            System.debug('Pages Count :: ' + existingPage.size());

            // -=-=- there can only be 131072 characters at max in a Long Text Area field (i.e.- CSV_Filter__c) -=-=-
            // -=-=- If there is more than 131072 characters in a String of Fillters, we will split the string and store it in multiple template Fields records ordered by Order_No_Simple__c field -=-=-
            Integer maxLength = 131072;
            Integer stringLength = filters.length(); 

            if (stringLength > maxLength) {
                System.debug('Length of string :: ' + stringLength);
                Decimal numberOfParts = (stringLength + maxLength - 1) / maxLength;
                System.debug('Number of parts :: ' + numberOfParts);

                for (Integer i = 0; i < Integer.valueOf(numberOfParts); i++) {
                    Integer startIndex = i * maxLength;
                    Integer endIndex = Math.min((i + 1) * maxLength, stringLength);
                    
                    String part = filters.substring(startIndex, endIndex);
                    
                    filterParts.add(part);
                    System.debug('This String is: ' + filterParts[i]);
                }
                System.debug('Number of parts: ' + filterParts.size());
            } else {
                filterParts.add(filters);
                System.debug('Main string length is within the limit :: ' + filters.length());
            }
            System.debug('List of filters ::: ' + filterParts);


            // -=-=- if there is not any Template_Fields__c and Template_Page__c records for a template (i.e.- New Templates) -=-=-
            if(existingPage.size() ==0 && existingFields.size() ==0){
                Template_Page__c tp = new Template_Page__c();
                tp.Page_Number__c =001;
                tp.Template__c = templateId;
                insert tp;

                List<Template_Fields__c> tf = new List<Template_Fields__c>();
                for (Integer i=0; i<filterParts.size() ; i++) {
                    String filterPart = filterParts[i];
                    Template_Fields__c t = new Template_Fields__c();
                    t.Template__c = templateId;
                    t.CSV_Fields__c = allFields;
                    t.Template_Page__c = tp.id;
                    t.CSV_Query__c = query;
                    t.CSV_Filter__c = filterPart;
                    t.Order_No_Simple__c = i;
                    tf.add(t);
                }

                insert tf;
                System.debug('Template Fields Saved : ' + tf);
            // -=-=- If there a Template_Page__c but not any Template_Fields__c records -=-=-
            }else if(existingPage.size() == 1 && existingFields.size() == 0){
                List<Template_Fields__c> tf = new List<Template_Fields__c>();
                for (Integer i=0; i<filterParts.size() ; i++) {
                    String filterPart = filterParts[i];
                    Template_Fields__c t = new Template_Fields__c();
                    t.Template__c = templateId;
                    t.CSV_Fields__c = allFields;
                    t.Template_Page__c = existingPage[0].id;
                    t.CSV_Query__c = query;
                    t.CSV_Filter__c = filterPart;
                    t.Order_No_Simple__c = i;
                    tf.add(t);
                }
                
                insert tf;
                System.debug(tf + ' : emplate Fields Saved with Existing Page: ' + existingPage[0]);
            // -=-=- If there are both Template_Page__c and Template_Fields__c records available -=-=-
            }else{
                Integer oldFLenght = existingFields.size();
                Integer newFLenght = filterParts.size();

                List<Template_Fields__c> tf = new List<Template_Fields__c>();
                List<Template_Fields__c> tfToDelete = new List<Template_Fields__c>();

                // -=-=- if the no. of existing Template_Fields__c records are only needed to store updated fielters -=-=-
                if(newFLenght == oldFLenght){
                    for(Integer i =0; i< newFLenght; i++){
                        Template_Fields__c t = existingFields[i];
                        t.CSV_Fields__c = allFields;
                        t.CSV_Query__c = query;
                        t.CSV_Filter__c = filterParts[i];
                        tf.add(t);
                    }

                // -=-=- If we require new template_fields__c records to store the Updated Filters -=-=-
                }else if(newFLenght > oldFLenght){
                    for(Integer i =0; i< oldFLenght; i++){
                        Template_Fields__c t = existingFields[i];
                        t.CSV_Fields__c = allFields;
                        t.CSV_Query__c = query;
                        t.CSV_Filter__c = filterParts[i];
                        tf.add(t);
                    }
                    for(Integer i=oldFLenght; i< newFLenght; i++){
                        Template_Fields__c t = new Template_Fields__c();
                        t.Template__c = templateId;
                        t.CSV_Fields__c = allFields;
                        t.Template_Page__c = existingPage[0].id;
                        t.CSV_Query__c = query;
                        t.CSV_Filter__c = filterParts[i];
                        t.Order_No_Simple__c = i;
                        tf.add(t);
                    }
                
                // -=-=- If we have enough old template_fields__c records to store filters string, we need to delete not used template fields records -=-=-
                }else if(newFLenght < oldFLenght){
                    for(Integer i =0; i< newFLenght; i++){
                        Template_Fields__c t = existingFields[i];
                        t.CSV_Fields__c = allFields;
                        t.CSV_Query__c = query;
                        t.CSV_Filter__c = filterParts[i];
                        tf.add(t);
                    }
                    for(Integer i=newFLenght; i< oldFLenght; i++){
                        Template_Fields__c t = existingFields[i];
                        tfToDelete.add(t);
                    }
                }
    
                if(tf.size() > 0){
                    // -=-=- We used Upsert because there can be records to insert or update both -=-=-
                    upsert tf;
                    System.debug('Upserted ' + tf.size() + ' fields');
                }
                if(tfToDelete.size() > 0){
                    delete tfToDelete;
                    System.debug('Deleted ' + tfToDelete.size() + ' fields');
                }
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'EditCSVTemplateController', 'saveTemplateFields');
        }
    }

/*
*********************************************************
@description    : Method is used to validate the Id entered in the field of ID and the lookups
@param objName  : {String} - name of the object
@param apiName  : {String} - api name of the field
@return         : {String} - Will return the Object Id prefix
********************************************************
*/
    @AuraEnabled
    public static String validateRelatedObject(String objName, String apiName){
        String prefix = '';
        try{
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            if(apiName == 'ID'){
                prefix = Schema.getGlobalDescribe().get(objName).getDescribe().getKeyPrefix();
            }else{
                // Check if the object exists in the global describe
                if (globalDescribe.containsKey(objName)) {
                    Schema.SObjectType sObjectType = globalDescribe.get(objName);
                    Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objName).getDescribe();
                    Map<String, Schema.SObjectField> fieldMap = sObjectType.getDescribe().fields.getMap();
                    
                    // Check if the field exists on the object
                    if (fieldMap.containsKey(apiName)) {
                        Schema.DescribeFieldResult fieldResult = fieldMap.get(apiName).getDescribe();
                        
                        // Check if the field is a reference field
                        if (fieldResult != null && fieldResult.getType() == Schema.DisplayType.REFERENCE) {
                            // Get the related object name
                            system.debug(fieldResult.getReferenceTo()[0].getDescribe().getName());
                            String relatedObjectName = fieldResult.getReferenceTo()[0].getDescribe().getName();
                            system.debug(Schema.getGlobalDescribe().get(relatedObjectName).getDescribe().getKeyPrefix());
                            prefix = Schema.getGlobalDescribe().get(relatedObjectName).getDescribe().getKeyPrefix();
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'EditCSVTemplateController', 'validateRelatedObject');
        }
        return prefix;
    }

    // -=-=- this method is used to test the query generated -=-=-
    // -=-=- If there will be error in the query, the Method will go in catch block else it will get executed properly -=-=- 
/*
*********************************************************
@description    : Method is used to test the query generated, using executing the query once
@param query    : {String} - Generated query string based on the Selections
@return         : (Nothing will be returned)
********************************************************
*/
    @AuraEnabled
    public static void testQueryMethod(String query){
        try {
            System.debug('The Query is : ' + query);
            System.debug(database.query(query));
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'EditCSVTemplateController', 'testQueryMethod');
        }
    }

    // -=-=- this wrapper is used to store the fieldName, apiName and fieldType of an Object selected -=-=- 
    // -=-=-  this wrapper is used in a method getFields -=-=- 
    public class FieldInfoWrapper {
        @AuraEnabled public String fieldName { get; set; }
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String fieldType { get; set; }
        @AuraEnabled public List<String> picklistValues { get; set; }
        @AuraEnabled public Boolean isSearchable { get; set; }
    }

    // -=-=- this wrapper is used to store the fields and filters strings containing data from existing template Fields for any template -=-=-
    // -=-=- this wrapper is used in a method getTemplateFieldsData -=-=-
    public class templateDataWrapper {
        @AuraEnabled public String fields { get; set; }
        @AuraEnabled public String filters { get; set; }
    }
}