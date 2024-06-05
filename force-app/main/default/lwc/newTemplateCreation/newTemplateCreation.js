import { LightningElement , api, track , wire} from 'lwc';
import newTemplateImage from '@salesforce/resourceUrl/new_template_image';
import newTemplateBg from '@salesforce/resourceUrl/new_template_bg';
import getObjects from '@salesforce/apex/NewTemplateCreationController.getObjects';
import getTemplateTypes from '@salesforce/apex/NewTemplateCreationController.getTemplateTypes';
import saveTemplate from '@salesforce/apex/NewTemplateCreationController.saveTemplate';
import { NavigationMixin } from 'lightning/navigation';
export default class NewTemplateCreation extends NavigationMixin(LightningElement) {

    components = {
        simpleTemplateBuilder : 'templateBuilder',
        csvTemplateBuilder : 'editCSVTemplate',
        dNdTemplateBuilder : 'editDragDropTemplate',
    }

    @track templateImage = newTemplateImage;
    @track templateBg = newTemplateBg;
    @api showModel;
    @track showSpinner;
    @track showRowColumn = false;
    @track objectNames = [];
    @track templateTypes = [];
    @track cellDivs = [];
    
    isImageLoaded;
    templateId = '';
    templateName = '';
    templateDescription = '';
    selectedObject = '';
    selectedTemplateType = '';
    isDataInvalid = false;
    selectedRows = null;
    selectedColumns = null;
    totalRows = 5;
    totalColumns = 3;

    renderedCallback() {
        this.template.host.style.setProperty('--background-image-url',`url(${this.templateBg})`);
    }

    connectedCallback(){
        this.showModel = true;
        this.showSpinner = true;
        this.isImageLoaded = false;
        this.createDivs();
    }

    imageLoaded(){
        this.isImageLoaded = true;
    }

    get doShowSpinner(){
        if(this.isImageLoaded == true && this.objectNames.length > 0 && this.templateTypes.length >0){
            return false;
        }
        return true;
    }

    createDivs(){
        this.cellDivs = [];
        for (let i = 0; i <5; i++) {
            for (let j = 0; j<3 ; j++){
                i==0 && j==0 ? this.cellDivs.push('tabel-cell unselected-cell selected-cell d' + i +'' + j ) : this.cellDivs.push('tabel-cell unselected-cell d' + i +'' + j );
            }
        }

        // console.log('Cells  :: ' + this.cellDivs);
    }

    @wire(getObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.objectNames = data.slice().sort((a, b) => a.name.localeCompare(b.name));
            getTemplateTypes()
            .then(result => {
                this.templateTypes = result;
                console.log('Picklist Values:', [...this.templateTypes]);
                this.showSpinner = false;
            })
            .catch(error => {
                console.error('Error fetching picklist values:', error);
                this.showSpinner = false;
            });

        } else if (error) {
            console.error('Error fetching object info:', error);
            this.showSpinner = false;
        }
    }

    handleTemplateNameChange(event) {
        this.isDataInvalid = false;
        this.template.querySelector('.t-name').classList.remove("error-border");
        this.template.querySelectorAll('label')[0].classList.remove("error-label");
        this.templateName = event.target.value.trim();
        if (!this.templateName) {
            this.template.querySelector('.t-name').classList.add("error-border");
            this.template.querySelectorAll('label')[0].classList.add("error-label");
            this.isDataInvalid = true;
        }
        
        // console.log('New Template Name:', this.templateName);
    }

    handleTemplateDescriptionChange(event){
        this.templateDescription = event.target.value.trim() ? event.target.value.trim() : '';
        
    }

    handleObjectChange(event) {
        this.isDataInvalid = false;
        this.template.querySelector('.object-dd').classList.remove("error-border");
        this.template.querySelectorAll('label')[2].classList.remove("error-label");
        this.selectedObject = event.target.value;
        if (!this.selectedObject || this.selectedObject=="--Select Object--") {
            this.template.querySelector('.object-dd').classList.add("error-border");
            this.template.querySelectorAll('label')[2].classList.add("error-label");
            this.isDataInvalid = true;
        }
        
        // console.log('Selected Object:', this.selectedObject);
    }
    handleTypeChange(event) {
        this.isDataInvalid = false;
        this.template.querySelector('.type-dd').classList.remove("error-border");
        this.template.querySelectorAll('label')[3].classList.remove("error-label");
        this.selectedTemplateType = event.target.value;
        if (!this.selectedTemplateType || this.selectedTemplateType=="--Select Template Type--") {
            this.template.querySelector('.type-dd').classList.add("error-border");
            this.template.querySelectorAll('label')[3].classList.add("error-label");
            this.isDataInvalid = true;
        }
        
        if(this.selectedTemplateType=='Drag&Drop Template'){
            this.showRowColumn = true
            this.selectedColumns =1;
            this.selectedRows = 1;
        }
        else{
            this.showRowColumn = false
            this.selectedColumns = null;
            this.selectedRows = null;
        }
    }

    handleColumnChange(event){
        this.isDataInvalid = false;
        this.template.querySelector('.num-input1').classList.remove("error-border");
        this.template.querySelectorAll('label')[4].classList.remove("error-label");
        this.selectedColumns = event.target.value;
        if(this.selectedTemplateType=='Drag&Drop Template'){
            if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
                this.template.querySelector('.num-input1').classList.add("error-border");
                this.template.querySelectorAll('label')[4].classList.add("error-label");
                this.isDataInvalid = true;
            }
        }
        
        console.log('Selected Columns:', this.selectedColumns);
            this.updateTable();
    }

    handleRowChange(event){
        this.isDataInvalid = false;
        this.template.querySelector('.num-input2').classList.remove("error-border");
        this.template.querySelectorAll('label')[5].classList.remove("error-label");
        this.selectedRows = event.target.value;
        if(this.selectedTemplateType=='Drag&Drop Template'){
            if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
                this.template.querySelector('.num-input2').classList.add("error-border");
                this.template.querySelectorAll('label')[5].classList.add("error-label");
                this.isDataInvalid = true;
            }
        }
        console.log('Selected Rows:', this.selectedRows);
            this.updateTable();
    }

    updateTable(){
        this.isDataInvalid = false;
        this.template.querySelector('.num-input1').classList.remove("error-border");
        this.template.querySelectorAll('label')[4].classList.remove("error-label");
        this.template.querySelector('.num-input2').classList.remove("error-border");
        this.template.querySelectorAll('label')[5].classList.remove("error-label");
        
        if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
            this.template.querySelector('.num-input1').classList.add("error-border");
            this.template.querySelectorAll('label')[4].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
            this.template.querySelector('.num-input2').classList.add("error-border");
            this.template.querySelectorAll('label')[5].classList.add("error-label");
            this.isDataInvalid = true;
        }

        if (this.selectedRows>0 && this.selectedRows<=5 && this.selectedColumns>0 && this.selectedColumns<=3) {
            console.log('table updating');
            for(let i=0;i<this.totalRows;i++){
                for(let j=0;j<this.totalColumns;j++){
                    let divClass = '.d'+i+''+j;
                    let div = this.template.querySelector(divClass);
                    if (div.classList.contains('selected-cell')) {
                        div.classList.remove('selected-cell');
                    }
                    if(i<this.selectedRows && j<this.selectedColumns){
                        div.classList.add('selected-cell');
                    }
                }
            }
        }else{
            for(let i=0;i<this.totalRows;i++){
                for(let j=0;j<this.totalColumns;j++){
                    let divClass = '.d'+i+''+j;
                    let div = this.template.querySelector(divClass);
                    if (div.classList.contains('selected-cell')) {
                        div.classList.remove('selected-cell');
                    }
                }
            }
        }
    }

    minusClick(event){
        // console.log('In Minus');
        const div = event.currentTarget
        if(div.classList.contains('minus1')){
            // console.log('nup input 1');
            this.template.querySelectorAll('input[type=number]')[0].stepDown();
        }else{
            // console.log('nup input 2');
            this.template.querySelectorAll('input[type=number]')[1].stepDown();
        }
        this.selectedColumns = this.template.querySelector('.num-input1').value;
        this.selectedRows = this.template.querySelector('.num-input2').value;
        this.updateTable();
        // console.log(div); 
    }
    plusClick(event){
        // console.log('In Plus');
        const div = event.currentTarget;
        if(div.classList.contains('plus1')){
            // console.log('nup input 1');
            this.template.querySelectorAll('input[type=number]')[0].stepUp();
        }else{
            // console.log('nup input 2');
            this.template.querySelectorAll('input[type=number]')[1].stepUp();
        }

        this.selectedColumns = this.template.querySelector('.num-input1').value;
        this.selectedRows = this.template.querySelector('.num-input2').value;
        this.updateTable();
    }

    closeModel(){
        const closeModalEvent = new CustomEvent('closemodal');
        this.dispatchEvent(closeModalEvent);
    }

    // handleNavigate() {
    //     console.log('selected Template Type: ' + this.selectedTemplateType);
    //     this.dispatchEvent(new CustomEvent('aftersave', {
    //         detail : {
    //                     'templateId' : this.templateId, 
    //                     'type' : this.selectedTemplateType, 
    //                     'objectName' : this.selectedObject}}))
    // }

    handleNavigate() {
        console.log('selected Template Type: ' + this.selectedTemplateType);
        var paramToPass = {
            templateId : this.templateId,
            objectName : this.selectedObject,
        }
        if(this.selectedTemplateType === 'Simple Template'){
            console.log('Navigating to simple template....... ' + this.templateId);
            this.navigateToComp(this.components.simpleTemplateBuilder, paramToPass);
            // };
        }else if(this.selectedTemplateType === 'CSV Template'){
            console.log('Navigating to CSV template....... ');
            this.navigateToComp(this.components.csvTemplateBuilder, paramToPass);
        }else if(this.selectedTemplateType === 'Drag&Drop Template'){
            console.log('Navigating to Drag&Drop template....... ');
            this.navigateToComp(this.components.dNdTemplateBuilder, paramToPass);
        }
    }


    saveNewTemplate(){

        this.template.querySelector('.t-name').classList.remove("error-border");
        this.template.querySelectorAll('label')[0].classList.remove("error-label");
        this.template.querySelector('.t-description').classList.remove("error-border");
        this.template.querySelectorAll('label')[1].classList.remove("error-label");
        this.template.querySelector('.object-dd').classList.remove("error-border");
        this.template.querySelectorAll('label')[2].classList.remove("error-label");
        this.template.querySelector('.type-dd').classList.remove("error-border");
        this.template.querySelectorAll('label')[3].classList.remove("error-label");
        this.isDataInvalid = false;

        if (!this.templateName) {
            this.template.querySelector('.t-name').classList.add("error-border");
            this.template.querySelectorAll('label')[0].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (!this.selectedObject || this.selectedObject=="--Select Object--") {
            this.template.querySelector('.object-dd').classList.add("error-border");
            this.template.querySelectorAll('label')[2].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (!this.selectedTemplateType || this.selectedTemplateType=="--Select Template Type--") {
            this.template.querySelector('.type-dd').classList.add("error-border");
            this.template.querySelectorAll('label')[3].classList.add("error-label");
            this.isDataInvalid = true;
        }
        if (this.selectedTemplateType == 'Drag&Drop Template') {
            this.template.querySelector('.num-input1').classList.remove("error-border");
            this.template.querySelectorAll('label')[4].classList.remove("error-label");
            this.template.querySelector('.num-input2').classList.remove("error-border");
            this.template.querySelectorAll('label')[5].classList.remove("error-label");
            if(!this.selectedColumns || this.selectedColumns<=0 || this.selectedColumns>3){
                this.template.querySelector('.num-input1').classList.add("error-border");
                this.template.querySelectorAll('label')[4].classList.add("error-label");
                this.isDataInvalid = true;
            }
            if(!this.selectedRows || this.selectedRows<=0 || this.selectedRows>5){
                this.template.querySelector('.num-input2').classList.add("error-border");
                this.template.querySelectorAll('label')[5].classList.add("error-label");
                this.isDataInvalid = true;
            }
        }
        if(!this.isDataInvalid){
            this.isImageLoaded = false;
            saveTemplate({
                templateName: this.templateName,
                templateDescription: this.templateDescription,
                sourceObject: this.selectedObject,
                templateType: this.selectedTemplateType,
                columnValue: this.selectedColumns,
                rowValue: this.selectedRows,
            })
            .then((data) => {
                this.templateId = data;
                console.log('Template ' + this.templateId +' saved successfully.');
                const messageContainer = this.template.querySelector('c-message-popup')
                messageContainer.showMessageToast({
                    status: 'success',
                    title: 'Yay! Everything worked!',
                    message : 'The template was saved successfully',
                    duration : 5000
                });
                this.handleNavigate();
                this.dispatchEvent(new CustomEvent('aftersave'))
                this.closeModel();

            })
            .catch(error => {
                console.error('Error saving template:', error);
                const messageContainer = this.template.querySelector('c-message-popup')
                messageContainer.showMessageToast({
                    status: 'error',
                    title: 'Uh oh, something went wrong!',
                    message : 'Sorry! There was a problem with your submission.',
                    duration : 5000
                });
                this.isImageLoaded = true;
            });
        }
    }

// -=-=- Used to navigate to the other Components -=-=-
    navigateToComp(componentName, paramToPass){
        try {
            var nameSpace = 'c';
            var cmpDef;
            if(paramToPass && Object.keys(paramToPass).length > 0){
                cmpDef = {
                    componentDef: `${nameSpace}:${componentName}`,
                    attributes: paramToPass,
                };
            }
            else{
                cmpDef = {
                    componentDef: `${nameSpace}:${componentName}`,
                };
            }
            
            let encodedDef = btoa(JSON.stringify(cmpDef));
            console.log('encodedDef : ', encodedDef);
            this[NavigationMixin.Navigate]({
                type: "standard__webPage",
                attributes: {
                url:  "/one/one.app#" + encodedDef
                }
            });
        } catch (error) {
            console.log('error in navigateToComp : ', error.stack);
        }
    }
}