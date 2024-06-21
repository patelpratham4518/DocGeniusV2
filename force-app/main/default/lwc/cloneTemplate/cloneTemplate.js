import { LightningElement , api, track , wire} from 'lwc';
import newTemplateImage from '@salesforce/resourceUrl/new_template_image';
import cloneTemplateImage from '@salesforce/resourceUrl/clone_template_image';
import newTemplateBg from '@salesforce/resourceUrl/new_template_bg';
import { NavigationMixin } from 'lightning/navigation';

export default class CloneTemplate extends NavigationMixin(LightningElement) {
  
    @api templatelist;
    @api selectedtemplateid;
    @api showModel;

    @track templateName;
    @track templateDescription;
    @track trmplateObject;
    @track templateType;
    @track templateImage = cloneTemplateImage;
    @track templateBg = newTemplateBg;
    @track showSpinner;
    @track showTempData = true;
    @track showSelectData = false;
    @track templateBody = true;
    @track header = true;
    @track footer = true;
    @track watermark = true;
    @track pageConfiguration = true;

    isImageLoaded;
    templateId = '';
    isDataInvalid = false;

    renderedCallback() {
        this.template.host.style.setProperty('--background-image-url',`url(${this.templateBg})`);
    }

    connectedCallback(){
        this.showModel = true;
        this.showSpinner = true;
        this.isImageLoaded = false;
        const template = this.templatelist.find(temp => temp.Id === this.selectedtemplateid);
        this.templateName = template.Template_Name__c;
        this.templateDescription = template.Description__c;
        if(this.templateDescription == undefined || this.templateDescription == null){
            this.templateDescription='';
        }
        this.trmplateObject = template.Object_API_Name__c;
        this.templateType = template.Template_Type__c;
        this.showSpinner = false;
    }

    imageLoaded(){
        this.isImageLoaded = true;
    }

    get doShowSpinner(){
        if(this.isImageLoaded == true){
            return false;
        }
        return true;
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
    }

    handleTemplateDescriptionChange(event){
        this.templateDescription = event.target.value.trim() ? event.target.value.trim() : '';
    }

    closeModel(){
        const closeModalEvent = new CustomEvent('closemodal');
        this.dispatchEvent(closeModalEvent);
    }

    cloneTemplate(){
        try {
            this.templateName = this.template.querySelector(`[data-name="temp-name"]`).value;
            this.templateDescription = this.template.querySelector(`[data-name="temp-description"]`).value;
            this.templateBody = this.template.querySelector(`[data-name="templateBody"]`).checked;
            this.header = this.template.querySelector(`[data-name="header"]`).checked;
            this.footer = this.template.querySelector(`[data-name="footer"]`).checked;
            this.watermark = this.template.querySelector(`[data-name="watermark"]`).checked;
            this.pageConfiguration = this.template.querySelector(`[data-name="pageConfiguration"]`).checked;
            console.log('this.templateName *** : ',this.templateName);
            console.log('this.templateDescription *** : ',this.templateDescription);
            console.log('this.templateBody *** : ',this.templateBody);
            console.log('this.header *** : ',this.header);
            console.log('this.footer *** : ',this.footer);
            console.log('this.watermark *** : ',this.watermark);
            console.log('this.pageConfiguration *** : ',this.pageConfiguration);
        } catch (error) {
                console.log('error in cloneTemplate : ', error.stack);
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