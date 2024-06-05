import { LightningElement, track, wire ,api} from 'lwc';
import getAllDocs from '@salesforce/apex/GoogleDocTemplateEditorController.getAllDocs'
import getTemplate from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplate'
import getUsernameAndEmail from '@salesforce/apex/GoogleDocTemplateEditorController.getUsernameAndEmail'

export default class GoogleDocTemplateEditor extends LightningElement {
    @api templateId = "a09F300000DMIOmIAP"
    @api objectName

    isSpinner = true
    selectedTemplate
    showPopup = false
    webViewLink
    @track templates
    @track allTemplates
    @track serachString = ""
    @track profile
   
    connectedCallback(){
        this.getProfile()
        getTemplate({id :this.templateId}).then(response => {
            if (response) {
                this.webViewLink = response
                this.isSpinner = false
            } else {
                this.showPopup = true
                getAllDocs()
                .then((response)=>{
                    this.allTemplates =  JSON.parse(response)
                    this.setDateAndSize()
                    this.templates = this.allTemplates
                    this.isSpinner = false
                }).catch(error => {
                    console.log('Error ==> ',error);
                })
            }
        }).catch(error => {
            console.log('Error ==> ',error);
        })

    }
    closePopup(){
        this.showPopup = false
    }
    openPopup(){
        this.showPopup = true
    }
    handleTemplateClick(event) {
        
        let selected = this.template.querySelector('.selected')
        if (selected) {
            selected.classList.remove("selected")
        }
        const templateId = event.currentTarget.dataset.id;
        this.selectedTemplate = this.templates.find(template => template.id === templateId);
        let template = event.currentTarget 
        template.classList.add("selected")
        console.log(template);
    }

    refreshDocs(){
        this.isSpinner = true
        this.getProfile()
        getAllDocs()
        .then((response)=>{
             this.allTemplates =  JSON.parse(response)
             this.setDateAndSize()
             this.templates = this.allTemplates
             this.serachString = null
            this.isSpinner = false
        }).catch(error => {
            console.log('Error ==> ',error);
        })
    }

    next(){
        if (this.selectedTemplate) {
            this.webViewLink = this.selectedTemplate.webViewLink
            this.closePopup()
        }
    }

    setDateAndSize(){
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
    }

    handleSearch(event){
        this.serachString = event.target.value
        if (this.serachString) {
            this.templates = this.allTemplates.filter(template => {
                // return template.name.includes(this.serachString)
                return template.name.toLowerCase().includes(this.serachString.toLowerCase())
                
            })
        } else {
            this.templates = this.allTemplates
        }
    }

    getProfile(){
        getUsernameAndEmail().then(response =>{
            this.profile = JSON.parse(response)
        }).catch(error => {
            console.log("Error ==> "+error);
        })
    }
}