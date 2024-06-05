public with sharing class EditDragDropTemplateController {
    @AuraEnabled
    public static List<Template__c> getTemplate(String templateId){
        List<Template__c> template = new List<Template__c>();
        template = [SELECT Id, Name, Template_Name__c, Template_Type__c, Row__c, Column__c, Object_API_Name__c FROM Template__c WHERE Id =: templateId];
        return template;
    }

    @AuraEnabled
    public static pairWrapperNew getObjectSelectField(String ObjectName){
        if(ObjectName == ''){
            return null;
        }
        List<pairWrapper> lstfieldname = new List<pairWrapper>();
        pairWrapperNew pairWrapperObj = new pairWrapperNew(); 
        List<String> apiList = new List<String>();
        List<String> notAccessList = new List<String>();
        List<String> notUpdatebleList = new List<String>();
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(ObjectName).getDescribe().fields.getMap();
      
        for (Schema.SObjectField fields: fieldMap.Values()) {  
            // if(fields.getDescribe().isAccessible() && fields.getDescribe().isUpdateable()){
                schema.describefieldresult dfield = fields.getDescribe();
                
                pairWrapper field = new pairWrapper();
                
                field.label            = dfield.getLabel();
                field.apiName          = dfield.getName();
                field.fieldType        = String.valueOf(dfield.getType());
                field.fieldSize        = Integer.valueOf(dfield.getLength());
                field.refrence         = String.valueOf(dfield.getReferenceTo());
                field.formulaField     = dfield.getDefaultValueFormula();
                field.relationshipName = dfield.getRelationshipName();    

                 apiList.add((dfield.getName()).toUpperCase());
                 

                if((field.apiName == 'Id')){
                    lstfieldname.add(field);
                }else if((dfield.isAccessible() == false)){
                    notAccessList.add((dfield.getName()).toUpperCase());
                }else if (dfield.isUpdateable() == true) {
                    lstfieldname.add(field);   
                }else{
                    notUpdatebleList.add((dfield.getName()).toUpperCase());
                }
        }
        
        Map<String, Schema.SObjectField> fieldMapNew = Schema.getGlobalDescribe().get(ObjectName).getDescribe().fields.getMap();
        
        map<string,string> newMap= new Map<string,string>();
        
        for(String strKey: fieldMapNew.keyset()) {
            newMap.put(strKey, String.valueof(fieldMap.get(strKey)));
        }
        pairWrapperObj.pairWrapperList = lstfieldname;
        pairWrapperObj.apiNameList = apiList;
        pairWrapperObj.fieldMap1 = newMap;
        pairWrapperObj.noAccessList = notAccessList;
        pairWrapperObj.noUpdateList = notUpdatebleList;

        return pairWrapperObj;
    }

    @AuraEnabled
    public static List<Template_Fields__c> getFields(String templateId){
        List<Template_Fields__c> template = new List<Template_Fields__c>();
        try {
            template = [SELECT Id, Name, Field_Label_D_D__c, Field_API_Name_D_D__c, Sr_Number_D_D__c, Sequence_Number_D_D__c FROM Template_Fields__c WHERE Template__c =: templateId];
        } catch (Exception e) {
            System.debug('Error in saving Template =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'NewTemplateCreationController', 'saveTemplate');
        }
        return template;
    }

    @AuraEnabled
    public static string saveFields(String templateId, String fieldName, String fieldAPI, String srNumber, String sequenceNumber){
        try {
            Template_Fields__c tempField = new Template_Fields__c();
            System.debug('templateId *** : '+ templateId);
            System.debug('fieldName *** : '+ fieldName);
            System.debug('fieldAPI *** : '+ fieldAPI);
            System.debug('srNumber *** : '+ srNumber);
            System.debug('sequenceNumber *** : '+ sequenceNumber);
            tempField.Template__c = templateId;
            tempField.Field_Label_D_D__c = fieldName;
            tempField.Field_API_Name_D_D__c = fieldAPI;
            tempField.Sr_Number_D_D__c = srNumber;
            tempField.Sequence_Number_D_D__c = sequenceNumber;
            insert tempField;
            return 'success';
        } catch (Exception e) {
            System.debug('Error in saving Template =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'NewTemplateCreationController', 'saveTemplate');
            return 'e';
        }
        
    }

    public class pairWrapper{
        @AuraEnabled public String label{get; set;}
        @AuraEnabled public String apiName{get; set;}
        @AuraEnabled public String fieldType{get; set;}
        @AuraEnabled public Integer fieldSize{get; set;}
        @AuraEnabled public String refrence{get; set;}
        @AuraEnabled public String formulaField{get; set;}
        @AuraEnabled public String relationshipName{get; set;}
    }

    public class pairWrapperNew{
        @AuraEnabled public List<string> apiNameList{get; set;}
        @AuraEnabled public List<string> noAccessList{get; set;}
        @AuraEnabled public List<string> noUpdateList{get; set;}
        @AuraEnabled public List<pairWrapper> pairWrapperList{get; set;}
        @AuraEnabled public Map<String, String> fieldMap1{get; set;}
    }
}