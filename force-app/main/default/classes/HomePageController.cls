public class HomePageController {
    @AuraEnabled
    public static returnValues getTemplateList(){
        returnValues returnValue = new returnValues();
        try {

            List<Template__c> tempList = [  SELECT Id, IsDeleted, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c 
                                            FROM Template__c 
                                            ORDER BY Template_Name__c ASC, CreatedDate ASC, Object_API_Name__c ASC];

            // Store Object API Name of create Templates...
            Set<String> objectList_Set = new Set<String>();  
            for(Template__c temp : tempList){
                objectList_Set.add(temp.Object_API_Name__c);
            }

            // Create List Of Object of create Templates with API and Label...
            List<tempObject> objectList = new List<tempObject>();
            if(objectList_Set.size() > 0){ 
                for(String objectApi : objectList_Set){
                    tempObject tempObj = new tempObject();
                    tempObj.value = objectApi;
                    tempObj.label = (String)Schema.getGlobalDescribe().get(objectApi).getDescribe().getLabel();
                    objectList.add(tempObj);
                }
            }

            // Create List of Only Date Field form Templare Object...
            List<tempDateFields> tempDateFields = new List<tempDateFields>();
            Map<String, Schema.SObjectField> MapofAllField = Schema.getGlobalDescribe().get('Template__c').getDescribe().fields.getMap();
            for(String fieldName : MapofAllField.keySet()){
                Schema.SObjectField field = MapofAllField.get(fieldName);
                Schema.DescribeFieldResult F = field.getDescribe();
                if((String.valueOf(F.getType()) == 'DATETIME' || String.valueOf(F.getType()) == 'DATE') && 
                (String.valueOf(F.getName()) != 'LastReferencedDate' &&  String.valueOf(F.getName()) != 'System Modstamp' && String.valueOf(F.getName()) != 'SystemModstamp' && String.valueOf(F.getName()) != 'LastViewedDate')){
                    tempDateFields dateField = new tempDateFields();
                    dateField.label = String.valueOf(F.getLabel());
                    dateField.value = String.valueOf(F.getName());
                    tempDateFields.add(dateField);
                }
            }

            // Assign Values to returnValue Object...
            returnValue.isSuccess = true;
            returnValue.objectList = objectList;
            returnValue.dateFields = tempDateFields;
            returnValue.returnMessage = 'Success';
            returnValue.templateList = tempList;
            return returnValue;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'docGeniusHomePageController', 'getTempalaterecords');
            system.debug('exception in getTempalaterecords : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            // Set False in case of Exception
            returnValue.isSuccess = false;          
            returnValue.returnMessage = 'Error in getTempalaterecords : ' + e.getMessage();
            return returnValue;
        }
    }

    @AuraEnabled
    public static string updateTemplate(String templateId, Boolean isActive){
        try {

            List<Template__c> tempToUpdate = [SELECT ID, Name, Template_Status__c  FROM Template__c WHERE ID = :templateId LIMIT 1];
            if(tempToUpdate.size() > 0){
                // if (Schema.sObjectType.Template__c.fields.Template_Status__c.isUpdateable()) {
                    tempToUpdate[0].Template_Status__c = isActive;
                    update tempToUpdate[0];
                // }
                return 'updated';
            }

            return 'no Template Found';
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'docGeniusHomePageController', 'updateTemplate');
            system.debug('exception in updateTemplate : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            return 'update Fail';
        }
    }

    @AuraEnabled
    public static string deleteTemplate(String templateId){
        try {

            List<Template__c> tempToDelete = [SELECT ID, Name  FROM Template__c WHERE ID =:templateId LIMIT 1];
            if(tempToDelete.size() > 0){
                delete tempToDelete[0];
                return 'deleted';
            }
                return 'no Template Found';

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'docGeniusHomePageController', 'deleteTemplate');
            system.debug('exception in deleteTemplate : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            return 'delete Fail';
        }
    }

    public class returnValues{
        @AuraEnabled public list<Template__c> templateList;
        @AuraEnabled public list<tempObject> objectList;
        @AuraEnabled public list<tempDateFields> dateFields;
        @AuraEnabled public boolean isSuccess;
        @AuraEnabled public String returnMessage;
    }

    public class tempObject{
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class tempDateFields{
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

}