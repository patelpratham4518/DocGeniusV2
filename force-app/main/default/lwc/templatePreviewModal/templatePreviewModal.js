import { LightningElement, api, track, wire } from "lwc";
import previewModal_img from "@salesforce/resourceUrl/previewModal_img";

export default class TemplatePreviewModal extends LightningElement {

    @api templateid;
    @api objectname;
    @api objectlabel;
    @api recordId;

    @track previewModal_img = previewModal_img;
    @track spinnerLabel = null;

    @track objectRecordList = null;
    @track selectedRecordId = null;

    @track isSpinner = false;
    @track vfPageSRC; 
    @track vfGeneratePageSRC;
    @track errorDetail = {};
    
    
    get label(){
        return `Select ${this.objectlabel} record`;
    }

    get placeHolder(){
        return `Search ${this.objectlabel} by Name or Id...`;
    }

    get helpText(){
       return `Select ${this.objectlabel} Record To Dispay Data on Template.`;
    }

    get disableRecordPicker(){
        return this.recordId ? true : false;
    }

    get disableGenerateBtn(){
        return this.selectedRecordId ? false : true;
    }

    get loadingInfo(){
        var info = `To generate a preview, please select any ${this.objectlabel} record first.`;
        return this.isSpinner == false ? info : `Generating Preview...`
    }

    connectedCallback(){
        try {
            // Set pre-selected Record Id...
            if(this.recordId){
                this.selectedRecordId = this.recordId;
            }

        } catch (error) {
            console.log('error in TemplatePreviewModal > connectedCallback', error.stack);
        }
    }

    onRecordSelect(event){
        try {
            if(event.detail && event.detail.length){
                this.selectedRecordId = event.detail[0].Id;
            }
            else{
                this.selectedRecordId = null;
            }
        } catch (error) {
            console.log('error in onRecordSelect > handleOnSearch', error.stack);
        }
    }

    handleRecordPickerError(event){
        console.log('handleRecordPickerError : ', event.detail);
    }

    generatePreview(){
        try {
            this.isSpinner = true;
            this.spinnerLabel = 'Generating Preview...';
            this.updateSpinnerLabel('We are Almost There... Please wait a while...', 4000);

            var previousSRC = this.vfPageSRC;

            var paraData = {
                'templateId' : this.templateid,
                'Object_API_Name__c' : this.objectname,
                'recordId' : this.selectedRecordId,
            }
            var paraDataStringify = JSON.stringify(paraData);
            console.log('vfPageSRC before : ', this.vfPageSRC);

            var newSRC = '/apex/DocPreviewPage?paraData=' + paraDataStringify;

            var paraData2 = {
                'templateId' : this.templateid,
                'Object_API_Name__c' : this.objectname,
                'recordId' : this.selectedRecordId,
                'docType' : 'DOC'
            }
            var paraDataStringify2 = JSON.stringify(paraData2);
            this.vfGeneratePageSRC = '/apex/DocGeneratePage?paraData=' + paraDataStringify2;

            if(newSRC != previousSRC){
                this.vfPageSRC = newSRC;
            }
            else{
                // Fake Loading...
                setTimeout(() => {
                    this.isSpinner = false;
                    this.spinnerLabel = 'Ready to Preview...';
        
                }, 500)
            }
            

        } catch (error) {
            console.log('error in TemplatePreviewModal > previewData', error.stack);
        }
    }

    vfPageLoaded(){
        try {
            console.log('loaded');

            this.isSpinner = false;
            this.spinnerLabel = 'Ready to Preview...';

        } catch (error) {
            console.log('error in TemplatePreviewModal > vfPageLoaded', error.stack);
        }
    }

    updateSpinnerLabel(labelToUpdate, updateOffset){
        setTimeout(() => {
            this.spinnerLabel = this.isSpinner ? labelToUpdate : this.spinnerLabel ;
            this.isSpinner && this.updateSpinnerLabel('Your Document took a little long... Thank you for your penitence...', 4000);
        }, updateOffset);

    }

    closeTemplatePreview(){
        try {
            this.dispatchEvent(new CustomEvent('closepreview'));
        } catch (error) {
            console.log('error in TemplatePreviewModal > closeTemplatePreview', error.stack);
        }
    }


    // ====== ======= ======== ======= ======= ====== GENERIC Method ====== ======= ======== ======= ======= ======
     // Generic Method to test Message Popup and Toast
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