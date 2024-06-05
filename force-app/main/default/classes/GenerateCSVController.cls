public with sharing class GenerateCSVController {

/*
*********************************************************
@description    : Method is used to get the template related data like, template name, object name, description of all active templates in the org
@param ---
@return         : List<Template__c> -list of templates of CSV type
********************************************************
*/
    @AuraEnabled
    public static List<Template__c> getAllTemplates(){
        List<Template__c> templates = new List<Template__c>();
        try {
            templates = [SELECT Id,Template_Name__c, Name, Object_API_Name__c, Description__c FROM Template__c WHERE Template_Status__c = true AND Template_Type__c = 'CSV Template'];
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GenerateCSVController', 'getAllTemplates');
        }

        return templates;
    }

/*
*********************************************************
@description    : Method is used to fetch the Query and count of records from the query
@param query    : {String} - templateId of the selected template
@return         : {String} - containing fields, Query and the count of records
********************************************************
*/
    @AuraEnabled
    public static String getTemplateData(String templateId){
        String allData = '';
        try{
            List<Template_Fields__c> tfList = [SELECT Id, CSV_Fields__c, CSV_Filter__c, CSV_Query__c, Template_Page__c FROM Template_Fields__c WHERE Template__c =:templateId ORDER BY Order_No_Simple__c asc NULLS Last LIMIT 1];
    
            if(!tfList.isEmpty()){
                String fields = tfList[0].CSV_Fields__c;
                System.debug('all the Fields here :: ' + fields);
                String query = tfList[0].CSV_Query__c;
    
                String sessionId = '';
    
                if(Test.isRunningTest()) { 
                    sessionId = 'testSessionId';
                }else{
                    sessionId = Page.UserSessionIdPage.getContent().toString();
                }
                system.debug('sessionId : '+sessionId);
    
    
                allData = fields + ' <|QDG|> ' + query + ' <|QDG|> ' + sessionId;
                System.debug('All the Data to be Sent is :: ' + allData);
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GenerateCSVController', 'getTemplateData');
        }
        return allData;
    }

}