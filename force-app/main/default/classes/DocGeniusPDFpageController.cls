public with sharing class DocGeniusPDFpageController {

    public String paraData {get; set;}
    public String displayText {get; set;}
    public String renderAS {get; set;}
    public String contentType {get; set;}
    public String docType {get; set;}
    public boolean useMode {get; set;}
    public String recordName {get; set;}
    public String displayData { get; set;}

    public DocGeniusPDFpageController() {

        renderAS = '';

        paraData = String.escapeSingleQuotes(ApexPages.currentPage().getParameters().get('paraData'));
        Map<String, Object> rawData = (Map<String, Object>)JSON.deserializeUntyped(paraData);

        system.debug('at final paraData : ' + paraData);
        system.debug('at final rawData : ' + rawData);

        Map<String, String> returnValue = TemplateBuilder_Controller.mappingFieldDataVF((String)rawData.get('templateId'), (String)rawData.get('recordId'), (String)rawData.get('Object_API_Name__c'));

        displayText = returnValue.get('modifiedHTML');
        recordName = returnValue.get('recordName');
        system.debug('templateId : ' + (String)rawData.get('templateId'));
        system.debug('recordId : ' + (String)rawData.get('recordId'));
        system.debug('objecAPI : ' + (String)rawData.get('Object_API_Name__c'));

        system.debug('docType : ' + (String)rawData.get('docType'));
        system.debug('useMode ' + (String)rawData.get('useMode'));

        // When Use Mode is preview id Download .. Set according to docType...
        if((String)rawData.get('useMode') == 'download'){
            if((String)rawData.get('docType') != null && (String)rawData.get('docType') != ''){
                
                if((String)rawData.get('docType') == 'PDF'){
                    renderAS = 'PDF';
                    contentType = '';
                }
                else if((String)rawData.get('docType') == 'DOC'){
                    renderAS = '';
                    contentType = 'application/msword#'+recordName+'.doc';
                }
                else if((String)rawData.get('docType') == 'PPT'){
                    renderAS = '';
                    contentType = 'application/vnd.ms-powerpoint';
                }
                docType = (String)rawData.get('docType');
                displayData = 'true';
           }
       }
       // When Use Mode is preview or not defined -- Render as PDF...
        else{
            renderAS = 'PDF';
            contentType = '';
            displayData = 'true';
        }

        system.debug('displayData ' + displayData);


    }

   public Pagereference generateDoc(){
        try {
            System.debug('paraData : '+ paraData);
            if(docType == 'PDF'){
                Pagereference pg = Page.DocGeniusPDFGeneratorPage;
                pg.getParameters().put('paraData', paraData);
                pg.getHeaders().put('content-disposition','attachment; filename=' + recordName+ '.pdf');
                pg.getContentaspdf();
                return pg;
            }
            if(docType == 'DOC'){
                Pagereference pg = Page.DocGeniusPDFGeneratorPage;
                pg.getParameters().put('paraData', paraData);
                pg.getHeaders().put('content-disposition','attachment; filename=' + recordName+ '.doc');
                pg.getContentaspdf();
                return pg;
            }
            if(docType == 'PPT'){
                Pagereference pg = Page.DocGeniusPDFGeneratorPage;
                pg.getParameters().put('paraData', paraData);
                pg.getHeaders().put('content-disposition','attachment; filename=' + recordName+ '.ppt');
                pg.getContentaspdf();
                return pg;
            }
            return null;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'TemplateBuilderController', 'getFieldMappingKeys');
            system.debug('exception in getFieldMappingKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());

            return null;
        }
    }
}