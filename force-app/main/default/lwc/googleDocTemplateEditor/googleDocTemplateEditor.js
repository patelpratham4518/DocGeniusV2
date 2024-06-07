import { LightningElement, track, wire ,api} from 'lwc';
import getAllDocs from '@salesforce/apex/GoogleDocTemplateEditorController.getAllDocs'
import getTemplate from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplate'
import getUsernameAndEmail from '@salesforce/apex/GoogleDocTemplateEditorController.getUsernameAndEmail'
import saveTemplateData from '@salesforce/apex/GoogleDocTemplateEditorController.saveTemplateData'
import saveHTML from '@salesforce/apex/GoogleDocTemplateEditorController.saveHTML'
import getTemplateName from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplateName'
import getLabel from '@salesforce/apex/GoogleDocTemplateEditorController.getLabel'
import new_template_bg from '@salesforce/resourceUrl/new_template_bg';
import leftBackground from '@salesforce/resourceUrl/leftBackground';
import { NavigationMixin } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class GoogleDocTemplateEditor extends NavigationMixin(LightningElement) {

    
    
    @api templateId 
    @api objectName
    
    
    // @wire(getObjectInfo, { objectApiName: objectName })
    // objectlabel;
    objectlabel

    isSpinner = true
    selectedTemplate
    showPopup = false
    webViewLink
    @track templates
    @track allTemplates
    @track serachString = ""
    @track profile
    templateBg = new_template_bg
    templateBgMain = leftBackground

    templateName = ""
    isPreview = false
    
    connectedCallback(){
        try {
            getLabel({objectName:this.objectName}).then(response=>{
                this.objectlabel = response
            }).catch(error=>{
                console.log("Error in get label=>",error);
            })
            this.getProfile()
            getTemplateName({templateId :this.templateId}).then(response=>{
                this.templateName = response
            })
            getTemplate({templateId :this.templateId}).then(response => {
                if (response) {
                    this.webViewLink = response
                    // this.isSpinner = false
                    this.isSpinner = true
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
            this.template.host.style.setProperty('--main-background-image-url',`url(${this.templateBgMain})`);
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
                this.isSpinner = true
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
        this.isPreview = true
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
            var fieldMappingContainer = this.template.querySelector('[data-name="fieldMappingContainer"]');
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


        // ==== Toggle Tab Methods - START - ========
        activeTabName = "contentTab";
        contentTab = true
        basicTab = false
        activeTab(event){
            try {
                let basicTab = this.template.querySelector(`.basicTab`).style
                let mainStyle = this.template.querySelector(`.main`).style
                
                if(event){
                    this.activeTabName = event.currentTarget.dataset.name;
                }
                this.setActiveTab();
                if (this.activeTabName == "contentTab") {
                    // this.contentTab = true
                    // this.basicTab = false
                    // this.isSpinner = true
                    mainStyle.display = "flex"
                    basicTab.display = "none"
                } else if(this.activeTabName == "basicTab"){
                    // this.basicTab = true
                    // this.contentTab = false
                    basicTab.display = "block"
                    mainStyle.display = "none"
                }
            } catch (error) {
                console.log('error in templateBuilder.activeTab : ', error.stack)
            }
        }
    
        setActiveTab(){
            try {
                console.log('activeTabName : ', this.activeTabName);
                const activeTabBar = this.template.querySelector(`.activeTabBar`);
                const tabS = this.template.querySelectorAll('.tab');
    
                tabS.forEach(ele => {
                    if(ele.dataset.name == this.activeTabName){
                        ele.classList.add('activeT');
                        activeTabBar.style = ` transform: translateX(${ele.offsetLeft}px);
                                        width : ${ele.clientWidth}px;`;
                    }
                    else{
                        ele.classList.remove('activeT');
                    }
                })
    
                const sections = this.template.querySelectorAll('.tabArea');
                sections.forEach(ele => {
                    if(ele.dataset.section == this.activeTabName){
                        ele.classList.remove('deactiveTabs');
                    }
                    else{
                        ele.classList.add('deactiveTabs');
                    }
                })
    
            } catch (error) {
                console.log('error in  : ', error.stack);
            }
        }
        // ==== Active Tab Methods - END - ========

        // on load start is not supported
        // iframeLoadnig(){
        //     console.log("Iframe loading");
        //     this.isSpinner = true
        // }

        iframeLoaded(){
            console.log("Iframe loaded");
            this.isSpinner = false
        }

        closeTemplatePreview(){
            this.isPreview = false
        }


    
}