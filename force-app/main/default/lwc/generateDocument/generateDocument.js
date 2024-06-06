import { LightningElement , api, track , wire} from 'lwc';
import rightBackground from '@salesforce/resourceUrl/rightBackground'
import { NavigationMixin } from 'lightning/navigation';
export default class GenerateDocument extends NavigationMixin(LightningElement) {

    components = {
        simpleTemplateBuilder : 'templateBuilder',
        csvTemplateBuilder : 'editCSVTemplate',
        dNdTemplateBuilder : 'editDragDropTemplate',
    }

    @api showModel;
    @api recordId;

    @track isSendEmail = false;
    // @track showSpinner;

    isInitialStyleLoaded = false;
    

    renderedCallback() {
        this.template.host.style.setProperty('--background-image-url',`url(${rightBackground})`);

        if(this.isInitialStyleLoaded) return;
        const STYLE = document.createElement('style');
        STYLE.innerHTML = `
            .slds-rich-text-editor__toolbar.slds-shrink-none {
                background-color: white;
            }
        `;

        this.template.querySelector('.main-div').appendChild(STYLE);
        this.isInitialStyleLoaded = true;
    }

    handleSelectTemplate(event){
        console.log('Selected template :: ' + event.detail.label);
    }

    handleEditTemplate(){
        console.log('Edit template called..' + this.recordId);
    }

    handleSendMail(){
        console.log('Send mail called with isSendEmail = ' + this.isSendEmail);
        this.isSendEmail = !this.isSendEmail;
    }
    
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