public with sharing class NewTemplateCreationController {
    
    @AuraEnabled(cacheable=true)
    public static List<ObjectInfo> getObjects() {
        List<ObjectInfo> objectsInfo = new List<ObjectInfo>();
        try {
            for ( Schema.SObjectType o : Schema.getGlobalDescribe().values() )
            {
                Schema.DescribeSObjectResult objResult = o.getDescribe();
                ObjectInfo info = new ObjectInfo();
                info.name = objResult.getLabel();
                info.apiName = objResult.getName();
                if(!info.apiName.containsignorecase('history') && !info.apiName.containsignorecase('tag') &&
                !info.apiName.containsignorecase('share') && !info.apiName.containsignorecase('feed') && 
                !info.apiName.containsignorecase('group') && !info.apiName.containsignorecase('public') &&
                !objResult.isCustomSetting() && objResult.isCreateable() &&
                objResult.getRecordTypeInfos().size() > 0){
                    
                    objectsInfo.add(info);
                }
            }
    
            System.debug('All objects size:: ' + objectsInfo.size());
            System.debug('All objects :: ' + objectsInfo);
        } catch (Exception e) {
            System.debug('Error in getObjects =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'NewTemplateCreationController', 'getObjects');
        }
        return objectsInfo;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getTemplateTypes() {
        List<String> picklistValues = new List<String>();
        try {
            Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get('Template__c').getDescribe().fields.getMap().get('Template_Type__c').getDescribe();
            if(fieldResult.getType() == Schema.DisplayType.Picklist) {
                List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
                for(Schema.PicklistEntry entry : picklistEntries) {
                    picklistValues.add(entry.getLabel());
                }
            }
        } catch (Exception e) {
            System.debug('Error in getTemplateTypes =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'NewTemplateCreationController', 'getTemplateTypes');
        }
        return picklistValues;
    }

    @AuraEnabled
    public static String saveTemplate(String templateName, String templateDescription, String sourceObject, String templateType, Decimal columnValue, Decimal rowValue){
        String templateId;
        try {
            System.debug('the data :: ' + templateName + ' :: ' + templateDescription + ' :: ' + sourceObject + ' :: ' + templateType + ' :: ' + columnValue + ' :: ' + rowValue);
            Template__c template = new Template__c();
            template.Template_Name__c = templateName;
            template.Description__c = templateDescription;
            template.Object_API_Name__c = sourceObject;
            template.Template_Type__c = templateType;
            template.Column__c = columnValue;
            template.Row__c = rowValue;
            template.Template_Status__c = true;
        
            System.debug('The Template :: ' + template);
            insert template;
            templateId = template.Id;
        } catch (Exception e) {
            System.debug('Error in saving Template =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'NewTemplateCreationController', 'saveTemplate');
            throw new AuraHandledException('error saving template.');
        }
        return templateId;
    }
    
    public class ObjectInfo {
        @AuraEnabled public String name {get; set;}
        @AuraEnabled public String apiName {get; set;}
    }
}