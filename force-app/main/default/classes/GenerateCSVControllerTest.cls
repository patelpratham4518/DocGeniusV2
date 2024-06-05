@IsTest
public class GenerateCSVControllerTest {
    
    @TestSetup
    static void makeData(){

        Account a = new Account(
            Name= 'Test Acc 1'
        );
        insert a;

        Template__c template = new Template__c(
            Template_Name__c = 'Test Template 1',
            Description__c = 'Test Description 1',
            Object_API_Name__c = 'Account',
            Template_Type__c = 'CSV Template',
            Template_Status__c = true
        );
        insert template;

        Template_Page__c tp = new Template_Page__c(
            Page_Number__c =001,
            Template__c = template.Id
        );
        insert tp;

        Template_Fields__c templateField= new Template_Fields__c(
            Template__c = template.Id,
            CSV_Fields__c = 'Name,Id',
            Template_Page__c = tp.id,
            CSV_Query__c = 'SELECT Name,Id FROM Account LIMIT 12',
            CSV_Filter__c = 'MasterRecordId<|IDG|>ASC<|SDG|>IsDeleted<|IDG|>ASC<|SDG|>Salutation<|IDG|>DESC<|MDG|>FirstName<|IDG|>=<|IDG|>test<|IDG|>STRING<|IDG|>text<|FDG|>Title<|IDG|>=<|IDG|>test title<|IDG|>STRING<|IDG|>text<|FDG|>Company<|IDG|>!=<|IDG|>test<|IDG|>STRING<|IDG|>text<|FDG|>Street<|IDG|>!=<|IDG|>test<|IDG|>TEXTAREA<|IDG|>text<|MDG|>AND<|MDG|>false<|LDG|>12',
            Order_No_Simple__c = 1
        );

        insert templateField;

    }

    @IsTest
    static void testGenerateCSV(){

        Template__c template = [SELECT Id FROM Template__c][0];
        template_fields__c tf = [SELECT Id, CSV_Query__c FROM Template_Fields__c][0];
        
        Test.startTest();
        

        List<Template__c> templates = GenerateCSVController.getAllTemplates();

        String allData = GenerateCSVController.getTemplateData(template.Id);


        Test.stopTest();

        Assert.areEqual(1, templates.size() , 'There should be only 1 template');

        Assert.isTrue(allData.contains(tf.CSV_Query__c), 'There is no Query returned in the All Data String...');

        
    }
}