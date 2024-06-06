import { LightningElement, track, wire ,api} from 'lwc';
import getAllDocs from '@salesforce/apex/GoogleDocTemplateEditorController.getAllDocs'
import getTemplate from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplate'
import getUsernameAndEmail from '@salesforce/apex/GoogleDocTemplateEditorController.getUsernameAndEmail'
import saveTemplateData from '@salesforce/apex/GoogleDocTemplateEditorController.saveTemplateData'
import saveHTML from '@salesforce/apex/GoogleDocTemplateEditorController.saveHTML'
import new_template_bg from '@salesforce/resourceUrl/new_template_bg';
import { NavigationMixin } from 'lightning/navigation';

export default class GoogleDocTemplateEditor extends NavigationMixin(LightningElement) {

    
    
    @api templateId 
    @api objectName

    isSpinner = true
    selectedTemplate
    showPopup = false
    webViewLink
    @track templates
    @track allTemplates
    @track serachString = ""
    @track profile
    templateBg = new_template_bg
    
    connectedCallback(){
        try {
            this.getProfile()
            getTemplate({templateId :this.templateId}).then(response => {
                if (response) {
                    this.webViewLink = response
                    this.isSpinner = false
                } else {
                    this.showPopup = true
                    getAllDocs()
                    .then((response)=>{
                        
                        this.allTemplates =  JSON.parse(response)
                        this.setDateAndSize()
                        if (this.allTemplates.length>0) {
                            this.templates = this.allTemplates
                        }
                        this.isSpinner = false
                    }).catch(error => {
                        console.log('Error ==> ',error);
                    })
                }
            }).catch(error => {
                console.log('Error ==> ',error);
            })
        } catch (error) {
            console.error(error)
        }

    }

    renderedCallback() {
        try {
            this.template.host.style.setProperty('--background-image-url',`url(${this.templateBg})`);
        } catch (error) {
            console.error(error)
        }
    }
    closePopup(){
        this.showPopup = false
    }

    openPopup(){
        this.showPopup = true
    }
    handleTemplateClick(event) {
        try {
            let selected = this.template.querySelector('.selected')
            if (selected) {
                selected.classList.remove("selected")
            }
            const templateId = event.currentTarget.dataset.id;
            this.selectedTemplate = this.templates.find(template => template.id === templateId);
            let template = event.currentTarget 
            template.classList.add("selected")
        } catch (error) {
            console.error(error);
        }

    }

    refreshDocs(){

        try {
            this.isSpinner = true
            this.getProfile()
            getAllDocs()
            .then((response)=>{
                 this.allTemplates =  JSON.parse(response)
                 this.setDateAndSize()
                 if (this.allTemplates.length>0) {
                     this.templates = this.allTemplates
                 }
                 else{
                    this.templates = undefined
                 }
    
                 this.serachString = null
                this.isSpinner = false
            }).catch(error => {
                console.log('Error ==> ',error);
            })
        } catch (error) {
            console.error(error);
        }

    }

    next(){
        try {
            if (this.selectedTemplate) {
                this.webViewLink = this.selectedTemplate.webViewLink
                this.closePopup()
                this.save()
            }else{
                const errorToast = this.template.querySelector('c-message-popup')
                errorToast.showMessagePopup({
                    'title' : 'Please Select Template',
                    'message' : 'To go ahead you must have to select a template.',
                }) 
            }
        } catch (error) {
            console.error(error);
        }

    }

    cancel(){
        this.closePopup()
        this.navigateToComp("homePage",{})
    }

    setDateAndSize(){
        try {
            this.allTemplates = this.allTemplates.map(template => {
                template.createdTime = template.createdTime.split("T")[0]
                if (template.size < 1024) {
                    template.size = Math.round(template.size)+"Byte"
                } else if (template.size < 1024*1024) {
                    template.size = Math.round(template.size/1024)+"KB"
                }else{
                    template.size = Math.round(template.size/(1024*1024))+"MB"
                }
                return template
            })
        } catch (error) {
            console.error(error);
        }

    }

    handleSearch(event){
        try {
            if (this.templates) {
                this.serachString = event.target.value
                if (this.serachString) {
                    this.templates = this.allTemplates.filter(template => {
                        return template.name.toLowerCase().includes(this.serachString.toLowerCase())
                        
                    })
                } else {
                    this.templates = this.allTemplates
                }
            }
        } catch (error) {
            console.error(error);
        }
    
    }

    getProfile(){
        try {
            getUsernameAndEmail().then(response =>{
                this.profile = JSON.parse(response)
            }).catch(error => {
                console.log("Error ==> "+error);
            })
        } catch (error) {
            console.error(error);
        } 
    }

    save(){
        saveTemplateData({
            "templateId" : this.templateId,
            "googleDocId" : this.selectedTemplate.id,
            "webViewLink" : this.selectedTemplate.webViewLink
        }).then(response=>{
            console.log("Template Data Saved");
        }).catch(error=>{
            console.log("Error saving template data ==> ",error);
        })
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


    saveIframe(){
        saveHTML({"templateId" : this.templateId}).then(response=>{
            console.log("HTML saved ",response);
        }).catch(error=>{
            console.log("Error in save Iframe==> ",error);
        })
    }
    saveTemplateDataIframe(){
        this.saveIframe()
    }
    handleSaveNPreviewIframe(){
        this.saveIframe()
    }
    handleSaveNCloseIframe(){
        this.navigateToComp("homePage",{})
        this.saveIframe()
    }

    @track isMappingOpen = false;
    @track isMappingContainerExpanded = false;
    showHideMappingContainer(){
        try {
            this.isMappingOpen = !this.isMappingOpen;
            var fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
            if(fieldMappingContainer){
                if(this.isMappingOpen){
                    fieldMappingContainer.classList.add('openFieldMapping');
                }
                else{
                    fieldMappingContainer.classList.remove('openFieldMapping');
                }
            }
        } catch (error) {
            console.log('error in showHideMappingContainer : ', error.stack);
        }
    }
}