public with sharing class TemplateBuilder_Controller {

    @AuraEnabled
    public static retrunWrapper getTemplateData(String templateId){
        RetrunWrapper retrunWrapper = new RetrunWrapper();
        try {
            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c ASC )
                                FROM Template__c WHERE Id =: templateId LIMIT 1];

            if(temp.size() > 0){
                SYSTEM.debug('Template__c : ' + temp[0]);
                if(temp[0].Template_Type__c == 'Simple Template'){
                    retrunWrapper.template = temp[0];

                    Obj_Label_API objLabelAPI = new Obj_Label_API();
                    objLabelAPI.name = Schema.getGlobalDescribe().get(temp[0].Object_API_Name__c).getDescribe().getName();
                    objLabelAPI.label = Schema.getGlobalDescribe().get(temp[0].Object_API_Name__c).getDescribe().getLabel();

                    retrunWrapper.objectLabelAPI = objLabelAPI;
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
    public static string saveTemplateApex(Template__c templateRecord, List<String> templateValues){
        try {

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c),
                                                (SELECT Id, Name,Page_Number__c, Template__c FROM Template_Pages__r)
                                                FROM Template__c WHERE Id =: templateRecord.Id LIMIT 1];

            if(temp.size() > 0){
                Template__c templateToUpdate = temp[0];
                templateToUpdate.Template_Name__c = templateRecord.Template_Name__c;
                templateToUpdate.Template_Status__c = templateRecord.Template_Status__c;
                templateToUpdate.Description__c = templateRecord.Description__c;

                Integer totalFieldRecords = templateValues.size();

                if(templateToUpdate.Template_Data__r.size() > 0){
                    Integer existingFieldRecords = templateToUpdate.Template_Data__r.size(); 

                    List<Template_Data__c>  tempFieldToUpdate = new  List<Template_Data__c>(); 
                    List<Template_Data__c>  tempFieldToInsert = new  List<Template_Data__c>();
                    integer tempFieldIndex = 0;
                    for(integer i = 0; i< totalFieldRecords; i++){
                        // Update Template Field record when Template field record count under Existing Template Field Record's Count;
                        if(i < existingFieldRecords){
                            templateToUpdate.Template_Data__r[i].Template_Value_Simple__c = templateValues[i];
                            tempFieldToUpdate.add(templateToUpdate.Template_Data__r[i]);
                        }
                        // Insert Template Field record when Template Field record count Excced Existing Template Field Record's Count;
                        else if(i >= existingFieldRecords){
                            Template_Data__c templateField = new Template_Data__c();
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
                    List<Template_Data__c>  tempFieldToDelete = new  List<Template_Data__c>();
                    if(totalFieldRecords < existingFieldRecords){
                        for(integer i = 0; i< existingFieldRecords; i++){
                            if(i >= totalFieldRecords){
                                tempFieldToDelete.add(templateToUpdate.Template_Data__r[i]);
                            }
                        }
                    }
                    if(tempFieldToDelete.size() > 0){
                        delete tempFieldToDelete;
                    }
                    
                }
                else{
                        List<Template_Data__c> templateFieldsToInsert = new List<Template_Data__c>();
                        for(integer i = 0; i< totalFieldRecords; i++){
                            Template_Data__c templateField = new Template_Data__c();
                            templateField.Template__c = templateToUpdate.Id;
                            // templateField.Template_Page__c = temPageToInsert[i].Id;
                            templateField.Template_Value_Simple__c = templateValues[i];
                            templateField.Order_No_Simple__c = (i + 1);
                            templateFieldsToInsert.add(templateField);
                        }

                        insert templateFieldsToInsert;

                }
                update templateToUpdate;

                return 'Temlpate Updated Successfully Success';
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

    public class RetrunWrapper{
        @AuraEnabled public boolean isSuccess;
        @AuraEnabled public String returnMessage;
        @AuraEnabled public Obj_Label_API objectLabelAPI;
        @auraEnabled public Template__c template;
    }

    public class Obj_Label_API{
        @AuraEnabled public String label;
        @AuraEnabled public String name;
    }
}