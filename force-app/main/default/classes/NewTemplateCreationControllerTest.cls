@IsTest
public class NewTemplateCreationControllerTest {

    @IsTest
    public static void testNewTemplate(){
        String templateName = 'Test Template';
        String templateDescription = 'Test Description';
        String sourceObject = 'Account';
        String templateType = 'CSV Template';
        Decimal columnValue = null;
        Decimal rowValue = null;
        
        Test.startTest();
        
        List<NewTemplateCreationController.ObjectInfo> objects = NewTemplateCreationController.getObjects();

        List<String> types = NewTemplateCreationController.getTemplateTypes();

        NewTemplateCreationController.saveTemplate(templateName,templateDescription, sourceObject, templateType, columnValue, rowValue);

        Test.stopTest();


        Assert.isTrue(objects.size() > 0, 'There are no Objects Returned by the class!!!!');
        Assert.isTrue(types.contains('CSV Template'), 'There are more than 3 types of the Template !!!!');

        Template__c template = [SELECT Id, Template_Name__c FROM Template__c LIMIT 1];

        Assert.areEqual(templateName, template.Template_Name__c , 'The Template name is different than assigned!!');
        
        
    }
}