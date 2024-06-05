import { LightningElement, api, track, wire } from "lwc";


export default class TemplatePreviewModal extends LightningElement {

    @api templateid;
    @api objectname;
    @api objectlabel;
    @api recordId;

    @track isSpinner = false;
    @track vfPageSRC; 
    @track errorDetail = {};
    
    generateOptions = {};

    displayInfo = {
        primaryField: `Name`,
        additionalFields: ['CreatedBy.Name'],
    };
    matchingInfo = {
        primaryField: { fieldPath: 'Name' },
        additionalFields: [{ fieldPath: 'CreatedBy.Name' }],
    };

    get label(){
        return `Select ${this.objectlabel} record`;
    }

    get placeHolder(){
        return `Search ${this.objectlabel} by Name or Create User...`;
    }

    get helpText(){
       return `Select ${this.objectlabel} Record To Dispay Data on Template.`;
    }

    get disableRecordPicker(){
        return this.recordId ? true : false;
    }

    get disableGenerateBtn(){
        if(Object.keys(this.generateOptions).length > 0 && this.generateOptions.hasOwnProperty('selectedRecordId')){
            return false;
        }
        else{
            return true;
        }
    }

    get spinnerLabel(){
        return this.isSpinner == false ? 'Preview' : 'Loading...';
    }
    get loadingInfo(){
        return this.isSpinner == false ? `Please select the ${this.objectlabel} record for display preview.` : `Generating Preview...`
    }

    connectedCallback(){
        try {
            // Set pre-selected Record Id...
            if(this.recordId){
                var generateOptions_temp = JSON.parse(JSON.stringify(this.generateOptions));
                generateOptions_temp['selectedRecordId'] = this.recordId;
                this.generateOptions = generateOptions_temp;

                this.generatePreview();
            }

        } catch (error) {
            console.log('error in TemplatePreviewModal > connectedCallback', error.stack);
        }
    }

    renderedCallback(){
        try {

        } catch (error) {
            console.log('error in TemplatePreviewModal > renderedCallback', error.stack);
        }
    }

    recordPickerLoaded(event){
        try {
        } catch (error) {
            console.log('error in TemplatePreviewModal > recordPickerLoaded', error.stack);
        }
    }

    recordChange(event){
        try {
            var generateOptions_temp = JSON.parse(JSON.stringify(this.generateOptions));
            if(event.detail.recordId != null){
                generateOptions_temp['selectedRecordId'] = event.detail.recordId ;
            }
            else{
                delete generateOptions_temp['selectedRecordId'];
            }

            this.generateOptions = generateOptions_temp;
        } catch (error) {
            console.log('error in TemplatePreviewModal > recordChange', error.stack);
        }
    }

    generatePreview(){
        try {
            this.isSpinner = true;

            var previousSRC = this.vfPageSRC;

            var paraData = {
                'templateId' : this.templateid,
                'Object_API_Name__c' : this.objectname,
                'recordId' : this.generateOptions['selectedRecordId'],
                'useMode' : 'preview',
            }
            var paraDataStringify = JSON.stringify(paraData);
            console.log('vfPageSRC before : ', this.vfPageSRC);

            var newSRC = '/apex/DocGeniusPDFGeneratorPage?paraData=' + paraDataStringify;
            if(newSRC != previousSRC){
                this.vfPageSRC = newSRC;
            }
            else{
                // Fake Loading...
                setTimeout(() => {
                    this.isSpinner = false;
        
                    this.resetGenerateOpt();
                }, 500)
            }
            

        } catch (error) {
            console.log('error in TemplatePreviewModal > previewData', error.stack);
        }
    }

    vfPageLoaded(){
        try {
            const iframeToolbarSection = this.template.querySelector('.iframeToolbarSection');
            iframeToolbarSection.classList.add('show');

            console.log('loaded');

            this.isSpinner = false;

            this.resetGenerateOpt();

        } catch (error) {
            console.log('error in TemplatePreviewModal > vfPageLoaded', error.stack);
        }
    }

    resetGenerateOpt(){
        var generateOptions_temp = JSON.parse(JSON.stringify(this.generateOptions));
        Object.keys(this.generateOptions).forEach(key => {
            delete generateOptions_temp[key]
        })
        this.generateOptions = generateOptions_temp;
    }

    handleRecordPickerError(event){
        try {
            var error = event.detail.error;
            console.warn('handleRecordPickerError : ', event.detail.error);
            
            this.errorDetail.title = 'Looks like there\'s a problem.';
            this.errorDetail.message = `Unfortunately, ${error.output.message}. Ask an admin for help.`;

            this.errorOccured = true;
            this.vfPageSRC = undefined;

        } catch (error) {
            console.log('error in TemplatePreviewModal > handleRecordPickerError', error.stack);
        }
    }

    closeTemplatePreview(){
        try {
            this.dispatchEvent(new CustomEvent('closepreview'));
        } catch (error) {
            console.log('error in TemplatePreviewModal > closeTemplatePreview', error.stack);
        }
    }


    // ====== ======= ======== ======= ======= ====== GENERIC Method ====== ======= ======== ======= ======= ======
     // Generetic Method to test Message Popup and Toast
     showMessagePopup(Status, Title, Message){
        const messageContainer = document.querySelector('c-message-popup');
        console.log('messageContainer : ', messageContainer);
        if(messageContainer){
            messageContainer.showMessagePopup({
                status: Status,
                title: Title,
                message : Message,
            });
        }
    }

    showMessageToast(Status, Title, Message, Duration){
        const messageContainer = document.querySelector('c-message-popup')
        if(messageContainer){
            messageContainer.showMessageToast({
                status: Status,
                title: Title,
                message : Message,
                duration : Duration
            });
        }
    }

}