public with sharing class DocPreviewController {

    public String paraData {get; set;}
    public String displayText {get; set;}
    // public String renderAS {get; set;}
    // public String contentType {get; set;}
    // public String docType {get; set;}
    // public boolean useMode {get; set;}
    // public String recordName {get; set;}
    public String pageMargins {get; set;}
    public String pageConfigUnit {get; set;}
    public String pageSize {get; set;}
    public String pageOrientation {get; set;}

    public DocPreviewController() {

        paraData = String.escapeSingleQuotes(ApexPages.currentPage().getParameters().get('paraData'));
        Map<String, Object> rawData = (Map<String, Object>)JSON.deserializeUntyped(paraData);

        Map<String, String> returnValue = KeyMappingController.mappingFieldDataVF((String)rawData.get('templateId'), (String)rawData.get('recordId'), (String)rawData.get('Object_API_Name__c'));

        displayText = returnValue.get('modifiedHTML');

        Template_Page__c pageConfigs = (Template_Page__c) JSON.deserialize(returnValue.get('pageConfigs'), Template_Page__c.class);
        pageMargins = pageConfigs.Page_Margin__c;
        pageConfigUnit = pageConfigs.unit_of_page_configs__c;
        pageOrientation = pageConfigs.Page_Orientation__c;
        pageSize = pageConfigs.Page_Size__c;

    }
}