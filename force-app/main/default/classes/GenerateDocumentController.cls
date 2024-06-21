public with sharing class GenerateDocumentController {
    
/*
*********************************************************
@description     : Method is used to fetch all the templates
@param           : objName {String} - Name of the object, from where the quick action is started
@return          : List<Template__c> - including all the templates fetched from org
********************************************************
*/
    @AuraEnabled
    public static List<Template__c> fetchTemplates(String objName){
        List<Template__c> templates = new List<Template__c>();
        try {
            templates = [ SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, LastModifiedDate FROM Template__c WHERE Object_API_Name__c=:objName];
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GenerateDocumentController', 'fetchTemplates');
        }
        return templates;
    }
}