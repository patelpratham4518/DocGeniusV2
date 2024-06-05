import { LightningElement , api, track , wire} from 'lwc';
import Popupimg from "@salesforce/resourceUrl/popupImage";
import { NavigationMixin } from 'lightning/navigation';
export default class integrationPopup extends NavigationMixin(LightningElement) {

    @track popupimg = Popupimg;
    @api showModel;
    @track showSpinner;
    
    @api draggedkey;
    @track clientId;
    @track clientSecret;
    @track bucket;
    @track nickname;
    @api redirecturi; 
    @track isDropbox = false;
    @track isGoogleDrive = false;
    @track isOneDrive = false;
    @track isAws = false;
    
    isImageLoaded;
    isDataInvalid = false;

    connectedCallback(){
        this.showModel = true;
        this.showSpinner = true;
        this.isImageLoaded = false;
        console.log(this.redirecturi);
        console.log(this.draggedkey);
        if(this.draggedkey == 'dropbox'){
            this.isDropbox = true;
        }
        else if(this.draggedkey == 'onedrive'){
            this.isOneDrive = true;
        }
        else if(this.draggedkey == 'aws'){
            this.isAws = true;
        }
        else if(this.draggedkey == 'google'){
            this.isGoogleDrive = true;
        }
    }

    imageLoaded(){
        this.isImageLoaded = true;
        console.log('image is loaded');
        const onimgload = new CustomEvent('onimgload');
        this.dispatchEvent(onimgload);
    }

    get doShowSpinner(){
        if(this.isImageLoaded == true){
            return false;
        }
        return true;
    }
    handleNickname(event){
        this.isDataInvalid = false;
        this.template.querySelector('.t-name').classList.remove("error-border");
        this.template.querySelectorAll('label')[0].classList.remove("error-label");
        this.nickname = event.target.value.trim();
        if (!this.nickname) {
            this.template.querySelector('.t-name').classList.add("error-border");
            this.template.querySelectorAll('label')[0].classList.add("error-label");
            this.isDataInvalid = true;
        }
        console.log(this.nickname);
    }

    handleClientId(event) {
        this.isDataInvalid = false;
        this.template.querySelector('.t-clientid').classList.remove("error-border");
        this.template.querySelectorAll('label')[1].classList.remove("error-label");
        this.clientId = event.target.value.trim();
        if (!this.clientId) {
            this.template.querySelector('.t-clientid').classList.add("error-border");
            this.template.querySelectorAll('label')[1].classList.add("error-label");
            this.isDataInvalid = true;
        }
        console.log(this.clientId);
    }

    handleClientSecret(event) {
        this.isDataInvalid = false;
        this.template.querySelector('.t-clientsecret').classList.remove("error-border");
        this.template.querySelectorAll('label')[2].classList.remove("error-label");
        this.clientSecret = event.target.value.trim();
        if (!this.clientSecret) {
            this.template.querySelector('.t-clientsecret').classList.add("error-border");
            this.template.querySelectorAll('label')[2].classList.add("error-label");
            this.isDataInvalid = true;
        }
        console.log(this.clientSecret);
        
    }

    handleBucket(event){
        this.isDataInvalid = false;
        this.template.querySelector('.t-bucket').classList.remove("error-border");
        this.template.querySelectorAll('label')[3].classList.remove("error-label");
        this.bucket = event.target.value.trim();
        if (!this.bucket) {
            this.template.querySelector('.t-bucket').classList.add("error-border");
            this.template.querySelectorAll('label')[3].classList.add("error-label");
            this.isDataInvalid = true;
        }
        console.log(this.bucket);
    }

    authorize(){
        
        this.template.querySelector('.t-clientid').classList.remove("error-border");
        this.template.querySelectorAll('label')[1].classList.remove("error-label");
        this.template.querySelector('.t-clientsecret').classList.remove("error-border");
        this.template.querySelectorAll('label')[2].classList.remove("error-label");
        if(this.isAws){
        this.template.querySelector('.t-name').classList.remove("error-border");
        this.template.querySelectorAll('label')[0].classList.remove("error-label");
        this.template.querySelector('.t-bucket').classList.remove("error-border");
        this.template.querySelectorAll('label')[3].classList.remove("error-label");
        }
        this.isDataInvalid = false;
        console.log('child0');
        if (!this.clientId) {
            this.template.querySelector('.t-clientid').classList.add("error-border");
            this.template.querySelectorAll('label')[1].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (!this.clientSecret) {
            this.template.querySelector('.t-clientsecret').classList.add("error-border");
            this.template.querySelectorAll('label')[2].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (!this.bucket && this.isAws == true) {
            this.template.querySelector('.t-bucket').classList.add("error-border");
            this.template.querySelectorAll('label')[3].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (!this.nickname && this.isAws == true) {
            this.template.querySelector('.t-name').classList.add("error-border");
            this.template.querySelectorAll('label')[0].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if(!this.isDataInvalid){
            console.log('child1');
            this.dispatchEvent(new CustomEvent('authorize', {
                detail: {
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    bucket: this.bucket,
                    nickname: this.nickname,
                    draggedkey: this.draggedkey
                }
            }));
            console.log('child2');
            this.bucket = null;
            this.clientId = null;
            this.clientSecret = null;
            this.redirecturi = null;
            this.nickname = null;
        }
    }


    // handleTemplateNameChange(event) {
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.t-name').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[0].classList.remove("error-label");
    //     this.templateName = event.target.value.trim();
    //     if (!this.templateName) {
    //         this.template.querySelector('.t-name').classList.add("error-border");
    //         this.template.querySelectorAll('label')[0].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
        
    //     // console.log('New Template Name:', this.templateName);
    // }

    // handleTemplateDescriptionChange(event){
    //     this.templateDescription = event.target.value.trim() ? event.target.value.trim() : '';
        
    // }

    // handleObjectChange(event) {
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.object-dd').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[2].classList.remove("error-label");
    //     this.selectedObject = event.target.value;
    //     if (!this.selectedObject || this.selectedObject=="--Select Object--") {
    //         this.template.querySelector('.object-dd').classList.add("error-border");
    //         this.template.querySelectorAll('label')[2].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
        
    //     // console.log('Selected Object:', this.selectedObject);
    // }
    // handleTypeChange(event) {
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.type-dd').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[3].classList.remove("error-label");
    //     this.selectedTemplateType = event.target.value;
    //     if (!this.selectedTemplateType || this.selectedTemplateType=="--Select Template Type--") {
    //         this.template.querySelector('.type-dd').classList.add("error-border");
    //         this.template.querySelectorAll('label')[3].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
        
    //     if(this.selectedTemplateType=='Drag&Drop Template'){
    //         this.showRowColumn = true
    //         this.selectedColumns =1;
    //         this.selectedRows = 1;
    //     }
    //     else{
    //         this.showRowColumn = false
    //         this.selectedColumns = null;
    //         this.selectedRows = null;
    //     }
    // }

    // handleColumnChange(event){
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.num-input1').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[4].classList.remove("error-label");
    //     this.selectedColumns = event.target.value;
    //     if(this.selectedTemplateType=='Drag&Drop Template'){
    //         if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
    //             this.template.querySelector('.num-input1').classList.add("error-border");
    //             this.template.querySelectorAll('label')[4].classList.add("error-label");
    //             this.isDataInvalid = true;
    //         }
    //     }
        
    //     console.log('Selected Columns:', this.selectedColumns);
    //         this.updateTable();
    // }

    // handleRowChange(event){
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.num-input2').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[5].classList.remove("error-label");
    //     this.selectedRows = event.target.value;
    //     if(this.selectedTemplateType=='Drag&Drop Template'){
    //         if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
    //             this.template.querySelector('.num-input2').classList.add("error-border");
    //             this.template.querySelectorAll('label')[5].classList.add("error-label");
    //             this.isDataInvalid = true;
    //         }
    //     }
    //     console.log('Selected Rows:', this.selectedRows);
    //         this.updateTable();
    // }

    // updateTable(){
    //     this.isDataInvalid = false;
    //     this.template.querySelector('.num-input1').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[4].classList.remove("error-label");
    //     this.template.querySelector('.num-input2').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[5].classList.remove("error-label");
        
    //     if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
    //         this.template.querySelector('.num-input1').classList.add("error-border");
    //         this.template.querySelectorAll('label')[4].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
    //     if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
    //         this.template.querySelector('.num-input2').classList.add("error-border");
    //         this.template.querySelectorAll('label')[5].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }

    //     if (this.selectedRows>0 && this.selectedRows<=5 && this.selectedColumns>0 && this.selectedColumns<=3) {
    //         console.log('table updating');
    //         for(let i=0;i<this.totalRows;i++){
    //             for(let j=0;j<this.totalColumns;j++){
    //                 let divClass = '.d'+i+''+j;
    //                 let div = this.template.querySelector(divClass);
    //                 if (div.classList.contains('selected-cell')) {
    //                     div.classList.remove('selected-cell');
    //                 }
    //                 if(i<this.selectedRows && j<this.selectedColumns){
    //                     div.classList.add('selected-cell');
    //                 }
    //             }
    //         }
    //     }else{
    //         for(let i=0;i<this.totalRows;i++){
    //             for(let j=0;j<this.totalColumns;j++){
    //                 let divClass = '.d'+i+''+j;
    //                 let div = this.template.querySelector(divClass);
    //                 if (div.classList.contains('selected-cell')) {
    //                     div.classList.remove('selected-cell');
    //                 }
    //             }
    //         }
    //     }
    // }

    // minusClick(event){
    //     // console.log('In Minus');
    //     const div = event.currentTarget
    //     if(div.classList.contains('minus1')){
    //         // console.log('nup input 1');
    //         this.template.querySelectorAll('input[type=number]')[0].stepDown();
    //     }else{
    //         // console.log('nup input 2');
    //         this.template.querySelectorAll('input[type=number]')[1].stepDown();
    //     }
    //     this.selectedColumns = this.template.querySelector('.num-input1').value;
    //     this.selectedRows = this.template.querySelector('.num-input2').value;
    //     this.updateTable();
    //     // console.log(div); 
    // }
    // plusClick(event){
    //     // console.log('In Plus');
    //     const div = event.currentTarget;
    //     if(div.classList.contains('plus1')){
    //         // console.log('nup input 1');
    //         this.template.querySelectorAll('input[type=number]')[0].stepUp();
    //     }else{
    //         // console.log('nup input 2');
    //         this.template.querySelectorAll('input[type=number]')[1].stepUp();
    //     }

    //     this.selectedColumns = this.template.querySelector('.num-input1').value;
    //     this.selectedRows = this.template.querySelector('.num-input2').value;
    //     this.updateTable();
    // }

    closeModel(){
        const closeModalEvent = new CustomEvent('closemodal');
        this.bucket = null;
        this.clientId = null;
        this.clientSecret = null;
        this.redirecturi = null;
        this.nickname = null;
        this.dispatchEvent(closeModalEvent);
    }

    // handleNavigate() {
    //     console.log('selected Template Type: ' + this.selectedTemplateType);
    //     this.dispatchEvent(new CustomEvent('aftersave', {
    //         detail : {
    //                     'templateId' : this.templateId, 
    //                     'type' : this.selectedTemplateType, 
    //                     'objectName' : this.selectedObject}}))

    //     let componentDef;
    //     if(this.selectedTemplateType === 'Simple Template'){
    //         console.log('Navigating to simple template....... ' + this.selectedObject);
    //         // componentDef = {
    //         //     componentDef: "c:simpleTemplateTest",
    //         //     attributes: {
    //         //         objectName: this.selectedObject,
    //         //         templateId : this.templateId
    //         //     }
    //         // };
    //     }else if(this.selectedTemplateType === 'CSV Template'){
    //         console.log('Navigating to CSV template....... ');
            
    //         // componentDef = {
    //         //     componentDef: "c:editCSVTemplate",
    //         //     attributes: {
    //         //         objectName: this.selectedObject,
    //         //         templateId : this.templateId
    //         //     }
    //         // };
            
    //     }else if(this.selectedTemplateType === 'Drag&Drop Template'){
    //         console.log('Navigating to Drag&Drop template....... ');
    //         // componentDef = {
    //         //     componentDef: "c:simpleTemplateTest",
    //         //     attributes: {
    //         //         objectName: this.selectedObject,
    //         //         templateId : this.templateId
    //         //     }
    //         // };
            
    //     }
    //     // Encode the componentDefinition JS object to Base64 format to make it url addressable
    //     // let encodedComponentDef = btoa(JSON.stringify(componentDef));
    //     // this[NavigationMixin.Navigate]({
    //     //     type: 'standard__webPage',
    //     //     attributes: {
    //     //         url: '/one/one.app#' + encodedComponentDef
    //     //     }
    //     // });
      
    // }

    // saveNewTemplate(){

    //     this.template.querySelector('.t-name').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[0].classList.remove("error-label");
    //     this.template.querySelector('.t-description').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[1].classList.remove("error-label");
    //     this.template.querySelector('.object-dd').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[2].classList.remove("error-label");
    //     this.template.querySelector('.type-dd').classList.remove("error-border");
    //     this.template.querySelectorAll('label')[3].classList.remove("error-label");
    //     this.isDataInvalid = false;

    //     if (!this.templateName) {
    //         this.template.querySelector('.t-name').classList.add("error-border");
    //         this.template.querySelectorAll('label')[0].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
    //     if (!this.selectedObject || this.selectedObject=="--Select Object--") {
    //         this.template.querySelector('.object-dd').classList.add("error-border");
    //         this.template.querySelectorAll('label')[2].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
    //     if (!this.selectedTemplateType || this.selectedTemplateType=="--Select Template Type--") {
    //         this.template.querySelector('.type-dd').classList.add("error-border");
    //         this.template.querySelectorAll('label')[3].classList.add("error-label");
    //         this.isDataInvalid = true;
    //     }
    //     if (this.selectedTemplateType == 'Drag&Drop Template') {
    //         this.template.querySelector('.num-input1').classList.remove("error-border");
    //         this.template.querySelectorAll('label')[4].classList.remove("error-label");
    //         this.template.querySelector('.num-input2').classList.remove("error-border");
    //         this.template.querySelectorAll('label')[5].classList.remove("error-label");
    //         if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
    //             this.template.querySelector('.num-input1').classList.add("error-border");
    //             this.template.querySelectorAll('label')[4].classList.add("error-label");
    //             this.isDataInvalid = true;
    //         }
    //         if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
    //             this.template.querySelector('.num-input2').classList.add("error-border");
    //             this.template.querySelectorAll('label')[5].classList.add("error-label");
    //             this.isDataInvalid = true;
    //         }
    //     }
    //     if(!this.isDataInvalid){
    //         this.isImageLoaded = false;
    //         saveTemplate({
    //             templateName: this.templateName,
    //             templateDescription: this.templateDescription,
    //             sourceObject: this.selectedObject,
    //             templateType: this.selectedTemplateType,
    //             columnValue: this.selectedColumns,
    //             rowValue: this.selectedRows,
    //         })
    //         .then((data) => {
    //             this.templateId = data;
    //             console.log('Template ' + this.templateId +' saved successfully.');
    //             const messageContainer = this.template.querySelector('c-message-popup')
    //             messageContainer.showMessageToast({
    //                 status: 'success',
    //                 title: 'Yay! Everything worked!',
    //                 message : 'The template was saved successfully',
    //                 duration : 5000
    //             });
    //             this.handleNavigate();
    //             this.closeModel();
    //         })
    //         .catch(error => {
    //             console.error('Error saving template:', error);
    //             const messageContainer = this.template.querySelector('c-message-popup')
    //             messageContainer.showMessageToast({
    //                 status: 'error',
    //                 title: 'Uh oh, something went wrong!',
    //                 message : 'Sorry! There was a problem with your submission.',
    //                 duration : 5000
    //             });
    //             this.isImageLoaded = true;
    //         });
    //     }
    // }
}