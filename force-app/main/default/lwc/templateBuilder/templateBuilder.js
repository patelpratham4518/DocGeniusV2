import { LightningElement, api, track, wire } from "lwc";
// import basePath from '@salesforce/community/basePath';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import summerNote_Editor from "@salesforce/resourceUrl/summerNote_Editor";
import docGeniusLogoSvg from "@salesforce/resourceUrl/docGeniusLogoSvg";
import getTemplateData from '@salesforce/apex/TemplateBuilder_Controller.getTemplateData';
import saveTemplateApex from '@salesforce/apex/TemplateBuilder_Controller.saveTemplateApex';
import { initializeSummerNote, setFieldMappingKeyisConfig } from './editorConf.js';
import {navigationComps, nameSpace} from 'c/utilityProperties';

export default class TemplateBuilder extends NavigationMixin(LightningElement) {

    @api templateId;
    @api objectName;
    @api activeTabName;

    @track startchat = true; // chatbot variable
    @track isSpinner = false;
    @track isPreview = false;
    @track object_Label = '';
    isIntialRender = true;

    @track objectLabelAPI = {} 
    @track templateRecord = {}

    @track vfPageSRC = ''
    successCount = 1;

    @track isMappingOpen = false;
    @track isMappingContainerExpanded = false;

    contentEditor;
    headerEditor;
    footerEditor;
    templateData;
    valueInserted = false;
    dataLoaded = false;
    searchFieldValue = '';
    @track loaderLabel = null;

   get setdocGeniusLogoSvg(){
    return docGeniusLogoSvg;
   }

    connectedCallback(){
        try {
                
                this.isSpinner = true;
                if(!this.activeTabName){
                    // If Active Tab is Not set by default... 
                    this.activeTabName =  'contentTab';
                }
                this.getTemplateValues();
                window.addEventListener('resize', this.resizeFunction);

        } catch (error) {
            console.log('error in TemplateBuilder.connectedCallback : ', error.stack);
        }
    }

    renderedCallback(){
        try {
            if(this.isIntialRender){
                // this.isSpinner = true;
            // ------------------------------------- Editor  -------------------------------------------
            Promise.all([
                loadScript(this, summerNote_Editor + '/jquery-3.7.1.min.js'),
            ])
            .then(result => { 
                Promise.all([
                    loadStyle(this, summerNote_Editor + '/summernote-lite.css'),
                    loadScript(this, summerNote_Editor + '/summernote-lite.js'),
                    
                ])
                .then(res => {
                    this.isIntialRender = false;
                    console.log('library loaded SuccessFully', {res});
                    this.initialize_Content_Editor();
                    this.initialize_Header_Editor();
                    this.initialize_Footer_Editor();

                    $(document).on("keyup", function(event){
                        // if user press clt + s on keybord
                        if (event.which == 83 && event.ctrlKey){
                        //    add your save method here
                        }
                      }
                    );
                })
                .catch(err => {
                    console.log('Error To Load summerNote_Editor >> ', {err}) 
                })
            })
            .catch(error => { 
                console.log('Error To Load Jquery >> ', {error}) ;
            })

            this.setActiveTab();
                
        }
        }
        catch(error){
            console.log('error in richTextEditor_custom.renderedCallback : ', error.stack);
        }
    }

    initialize_Content_Editor(){
        try {
            this.contentEditor = this.template.querySelector(`[data-name="templateContent"]`);
            var isLoadedSuccessfully = initializeSummerNote(this ,docGeniusLogoSvg, 'templateContent');

            if(isLoadedSuccessfully == true){
                this.SetCSSbasedOnScreenChangeIn();
                this.setDataInEditor();
            }
            else{
                this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
            }

            this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();

        } catch (error) {
            console.log('error in richTextEditor_custom.initialize_Content_Editor : ', error.stack);
        }
    }

    // initialize_Header_Editor(){
    //     try {
    //         this.headerEditor = this.template.querySelector(`[data-name="headerEditor"]`);
    //         var isLoadedSuccessfully = initializeSummerNote(this, docGeniusLogoSvg, 'headerEditor');

    //         if(isLoadedSuccessfully == false){
    //             this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
    //         }
            
    //     } catch (error) {
    //         console.log('error in initialize_Header_Editor : ', error.stack);
    //     }
    // }

    // initialize_Footer_Editor(){
    //     try {
    //         this.footerEditor = this.template.querySelector(`[data-name="footerEditor"]`);
    //         var isLoadedSuccessfully = initializeSummerNote(this, docGeniusLogoSvg, 'footerEditor');

    //         if(isLoadedSuccessfully == false){
    //             this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
    //         }
            
    //     } catch (error) {
    //         console.log('error in initialize_Footer_Editor : ', error.stack);
    //     }
    // }

    successCountPlus(){
        this.successCount ++;
        return true;
    }

    // Use Arrow Function...
    resizeFunction = () => {
        this.SetCSSbasedOnScreenChangeIn();
    };

    SetCSSbasedOnScreenChangeIn(){
        try {

            var fieldMappingSection = this.template.querySelector('.fieldMappingContainer');
            
            if(this.activeTabName == 'contentTab' || this.activeTabName == 'headerFooterTab'){
    
                if(fieldMappingSection){
                    fieldMappingSection.classList.add('displayFieldMappings');
                }
            }
            else if(this.activeTabName == 'waterMarkTab'){
                var waterMark_SubSection = this.template.querySelector('.waterMark_SubSection');
                if(waterMark_SubSection){
                }

                if(fieldMappingSection){
                    fieldMappingSection.classList.remove('displayFieldMappings');
                }
            }
            else if(this.activeTabName == 'basicTab'){
                var updateDeatilContainer = this.template.querySelector('.updateDeatilContainer');

                if(updateDeatilContainer){
                    updateDeatilContainer.style = `height : calc(100% - 64px - 1.5rem); `
                }

                if(fieldMappingSection){
                    fieldMappingSection.classList.remove('displayFieldMappings');
                }
            }

        } catch (error) {
            console.log(' error in SetCSSbasedonScreenChange : ', error.stack);
            
        }
    }

    getTemplateValues(){
        try {
            console.log('templateId : ', this.templateId);
            if(this.templateId && this.templateId != '' && this.templateId != null){
                getTemplateData({templateId : this.templateId})
                .then(result => {
                    console.log('getTemplateData result  : ', result);
                    if(result.isSuccess){
                        this.objectLabelAPI = result.objectLabelAPI;
                        this.object_Label = result.objectLabelAPI.label;
                        this.templateRecord = result.template;
                        this.templateRecord.createDateOnly = this.templateRecord.CreatedDate.split("T")[0];
                        this.templateData = '';
                        if(result.template.Template_Data__r){
                            // Collect Value in Single variable...
                            result.template.Template_Data__r.forEach(ele => {
                                this.templateData += ele.Template_Value_Simple__c;
                            })

                            // Insert Value in Quill Editor...
                            this.dataLoaded = true;
                            this.setDataInEditor();
                        }
                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                    }
                    else{
                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                        this.showMessagePopup('Error', 'Error While Fetching Template Data', result.returnMessage);
                    }
                })
                .catch(error => {
                    this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                    console.log('error in getTemplateData apex callout : ', error.message);
                })
            }
        } catch (error) {
            console.log('error in templateBuilder.getTemplateValues : ', error.stack);
            
        }
    }

    setDataInEditor(){
        try {
            if(this.contentEditor && this.dataLoaded && !this.valueInserted){
                $(this.contentEditor).summernote('code', this.templateData);
                this.valueInserted = true;
            }
        } catch (error) {
            console.log('error in templateBuilder.setDataInEditor : ', error.stack);
        }
    }

    saveTemplateData(){
        this.saveTemplateValue('save');
    }

    saveTemplateValue(actionName){
        try {
            this.isSpinner = true;
            this.loaderLabel = actionName == 'close' ? 'Closing Builder...' : 'Saving Data...'
            var templateData = $(this.contentEditor).summernote('code')
                    
            // Separate Template Data By Long TExt area Length....
                var splitLength = 130000;
                var templateValuePortion = [];
                var valuePartion = Math.ceil(templateData.length / splitLength);
                for(var i = 1; i<= valuePartion; i++){
                    var startIndex = (i - 1)*splitLength ;
                    var endIndex = i ==  valuePartion ? templateData.length : (i * splitLength);
                    templateValuePortion.push(templateData.substring(startIndex, endIndex));
                }

                // Call Apex Method to save Template...
                saveTemplateApex({templateRecord : this.templateRecord, templateValues : templateValuePortion})
                .then(result => {
                    console.log('result of saveTemplateApex : ', result);
                    if(result){
                        if(actionName == 'save'){
                            this.isSpinner = false;
                            this.loaderLabel = 'Data Saved Successfully...'
                            $(this.contentEditor).summernote('code', templateData);
                        }
                        else if(actionName == 'preview'){
                            this.isSpinner = false;
                            this.loaderLabel = 'Opening Preview...'
                            // To not confect with loader...
                            setTimeout(() =>{
                                this.isPreview = true;
                            }, 500)
                        }
                        else if(actionName == 'close'){
                            this.isSpinner = false;
                            this.closeEditTemplate();
                        }
                    }
                })
                .catch(error => {
                    console.log('error in saveTemplateApex : ', error.stack);
                    this.isSpinner = false;
                })

        } catch (error) {
            console.log(`error in templateBuilder.saveTemplateData for action - ${actionName} : `, error.stack);
            this.isSpinner = false;
        }
    }

    handleSaveNClose(){
        this.saveTemplateValue('close');
    }
    
    closeEditTemplate(){
        try {
            $(this.contentEditor).summernote('destroy');
            this.navigateToComp(navigationComps.home);
        } catch (error) {
           console.log('error in templateBuilder.closeEditTemplate : ', error.stack)
        }
    }

    handleSaveNPreview(){
        this.saveTemplateValue('preview');
    }

    vfPageLoaded(){
        try {
            this.isSpinner = false;
            const iframe = this.template.querySelector('iframe');
            const pdfViewer = iframe.querySelector( 'pdf-viewer' );
            console.log('pdfViewer : ', pdfViewer);
        } catch (error) {
            console.log('log in templateBuilder.vfPageLoaded : ', error.stack);
        }
    }

    closeTemplatePreview(){
        try {
            this.isPreview = false;
        } catch (error) {
            console.log('error in templateBuilder.closeTemplatePreview : ', error.stack);
        }
    }

    // ==== Toggle Tab Methods - START - ========
    activeTab(event){
        try {
            if(event){
                this.activeTabName = event.currentTarget.dataset.name;
            }
            this.setActiveTab();
            this.SetCSSbasedOnScreenChangeIn();
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


    // ===== Chatbot Methods - START - =============
    openChatBot(){
        if(this.startchat){
            this.startchat = false;
            const CHATPOPUP = this.template.querySelector('c-chat-bot');
            CHATPOPUP.togglePopup();
            console.log('chat bot called');
        }
        else{
            console.log(this.startchat);
        }
    }

    updateChatStatus(event){
        console.log(event.detail.message);
        setTimeout(()=>{
            this.startchat = event.detail.message
        },1000)
        console.log(this.startchat);
    }
    // ===== Chatbot Methods - END - =============

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

    toggleMappingContainerHeight(){
        try {
            const fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
            if(this.isMappingContainerExpanded){
                this.isMappingContainerExpanded = false;
                fieldMappingContainer.style = ``;
            }
            else {
                this.isMappingContainerExpanded = true;
                fieldMappingContainer.style = ` height : calc(100% - 0.9rem);
                                                top : 0.1rem;`;
            }
        } catch (error) {
            console.log('error in toggleMappingContainerHeight : ', error.stack);
        }
    }

    handleMarginUnitChange(event){
        try {
            console.log('selected Unit : ', event.target.value);
        } catch (error) {
            console.log('error in handleMarginUnitChange');
        }
    }


    // ====== ======= ======== ======= ======= ====== GENERIC Method ====== ======= ======== ======= ======= ======
     // Generic Method to test Message Popup and Toast
        showMessagePopup(Status, Title, Message){
            const messageContainer = document.querySelector('c-message-popup')
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

        navigateToComp(componentName, paramToPass){
            try {
                var cmpDef;
                if(paramToPass && Object.keys(paramToPass).length > 0){
                    cmpDef = {
                        componentDef: `${nameSpace}:${componentName}`,
                        attributes: paramToPass
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