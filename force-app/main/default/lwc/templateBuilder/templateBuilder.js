import { LightningElement, api, track, wire } from "lwc";
// import basePath from '@salesforce/community/basePath';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import summerNote_Editor from "@salesforce/resourceUrl/summerNote_Editor";
import docGeniusLogoSvg from "@salesforce/resourceUrl/docGeniusLogoSvg";
import getTemplateData from '@salesforce/apex/TemplateBuilder_Controller.getTemplateData';
import getFieldMappingKeys from '@salesforce/apex/TemplateBuilder_Controller.getFieldMappingKeys';
import saveTemplateApex from '@salesforce/apex/TemplateBuilder_Controller.saveTemplateApex';
import insertImgAsContentVersion from '@salesforce/apex/TemplateBuilder_Controller.insertImgAsContentVersion';
import { intializeSummerNote, setFieldMappingKeyisConfig } from './editorConf.js';
import {navigationComps, nameSpace} from 'c/utilityProperties';

export default class TemplateBuilder extends NavigationMixin(LightningElement) {

    @api templateId;
    @api objectName;
    isIntialRender = true;
    @track isSpinner = false;
    @track isPreview = false;
    @track disableDeatilSave = false;
    @track object_Label = '';

    @track field_Vs_KeyList = [];
    @track objectLabelAPI = {} 
    @track templateRecord = {}

    @track editDetailMode = false;

    editedTempDetail = {}
    edtAnimationDuration = 300;

    @track sourceObjectList = [];
    @track fieldMappingsWithObj = [];
    baseObject = '';
    @track diplayFieldMapping = [];
    successCount = 0;
    @track vfPageSRC = ''

    @track activeTabName = 'contentTab';
    @track isMappingOpen = false;

    contentEditor;
    headerEditor;
    footerEditor;
    templateData;
    valueInserted = false;
    dataLoaded = false;
    searchFieldValue = '';

    get loadStyle(){
        return `--edtAnimationDuration : ${this.edtAnimationDuration/1000}s`;
    }

    get showcombo(){
        return this.sourceObjectList.length ? true : false;
   }

   get setdocGeniusLogoSvg(){
    return docGeniusLogoSvg;
   }

   get displayFieldMapping(){
        return this.activeTabName == 'contentTab' || this.activeTabName == 'headerFooterTab' ? true : false;
   }

   get displayWatremarkOpt(){
        return this.activeTabName == 'waterMarkTab' ? true : false
   }

   get displayUpdateDetail(){
        return this.activeTabName == 'basicTab' ? true : false
   }

    connectedCallback(){
        try {
                this.isSpinner = true;
                this.getTemplateValues();
                this.getFieldMapping();
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
            var isLoadedSuccessfully = intializeSummerNote(this.template, document,docGeniusLogoSvg, 'templateContent');

            if(isLoadedSuccessfully == true){
                this.SetCSSbasedonScreenChangeIn();
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

    initialize_Header_Editor(){
        try {
            this.headerEditor = this.template.querySelector(`[data-name="headerEditor"]`);
            var isLoadedSuccessfully = intializeSummerNote(this.template, document,docGeniusLogoSvg, 'headerEditor');

            if(isLoadedSuccessfully == false){
                this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
            }
            
        } catch (error) {
            console.log('error in initialize_Header_Editor : ', error.stack);
        }
    }

    initialize_Footer_Editor(){
        try {
            this.footerEditor = this.template.querySelector(`[data-name="footerEditor"]`);
            var isLoadedSuccessfully = intializeSummerNote(this.template,document ,docGeniusLogoSvg, 'footerEditor');

            if(isLoadedSuccessfully == false){
                this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
            }
            
        } catch (error) {
            console.log('error in initialize_Footer_Editor : ', error.stack);
        }
    }

    successCountPlus(){
        this.successCount ++;
        return true;
    }

    // Use Arrow Function...
    resizeFunction = () => {
        this.SetCSSbasedonScreenChangeIn();
    };

    SetCSSbasedonScreenChangeIn(){
        try {
            var toobarHeight = this.template.querySelector('.note-toolbar') ? this.template.querySelector('.note-toolbar').scrollHeight : 64;
            toobarHeight = toobarHeight == 0 ? 64 : toobarHeight;

            var fiedMappignSection = this.template.querySelector('.fieldMappingContainer');
            
            if(this.activeTabName == 'contentTab' || this.activeTabName == 'headerFooterTab'){
    
                if(fiedMappignSection){
                    var marginGap = window.innerWidth > 1200 ? 1.5 : 0.5 ;
                    fiedMappignSection.classList.add('displayFieldMappings');
                    // fiedMappignSection.style = `height : calc(100% - ${toobarHeight}px - ${marginGap}rem); 
                    //                             top: calc(${toobarHeight}px + 1rem);`;
                }
            }
            else if(this.activeTabName == 'waterMarkTab'){
                var waterMark_SubSection = this.template.querySelector('.waterMark_SubSection');
                if(waterMark_SubSection){
                    // waterMark_SubSection.style = `height : calc(100% - ${toobarHeight}px - 1rem); `
                }

                if(fiedMappignSection){
                    fiedMappignSection.classList.remove('displayFieldMappings');
                }
            }
            else if(this.activeTabName == 'basicTab'){
                var updateDeatilContainer = this.template.querySelector('.updateDeatilContainer');

                if(updateDeatilContainer){
                    updateDeatilContainer.style = `height : calc(100% - ${toobarHeight}px - 1.5rem); `
                }

                if(fiedMappignSection){
                    fiedMappignSection.classList.remove('displayFieldMappings');
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
                        this.templateRecord = result.template;
                        this.templateRecord.createDateOnly = this.templateRecord.CreatedDate.split("T")[0];
                        this.templateData = '';
                        if(result.template.Template_Fields__r){
                            // Collect Value in Sinle variable...
                            result.template.Template_Fields__r.forEach(ele => {
                                this.templateData += ele.Template_Value_Simple__c;
                            })

                            // Insert Value in Quill Editor...
                            this.dataLoaded = true;
                            this.setDataInEditor();
                        }
                        this.setTempDetail();
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

    getFieldMapping(){
        try {
            getFieldMappingKeys({sourceObjectAPI : this.objectName})
            .then(result => {
                console.log('getFieldMappingKeys result  : ', result);
                    if(result.isSuccess){
                        // Set... Base Object, Related Parent Object and It's Fileds with mapping key
                        this.object_Label = result.objectLabelAPI.label;
                        var sourceObjectList = [];
                        var fielMappingKeysList = [];
                        result.fieldMappingsWithObj.forEach(obj => {
                            sourceObjectList.push({label : obj.label, value: obj.name});
                            if(!obj.label.includes('>')){
                                this.objectName = obj.name;
                                this.baseObject = obj.name;
                            }
                            obj.fieldMappings.forEach(ele => {
                                fielMappingKeysList.push(ele.name);
                            })
                        });
                        this.sourceObjectList = JSON.parse(JSON.stringify(sourceObjectList));
                        console.log('this.sourceObjectList : ', this.sourceObjectList);
                        this.fieldMappingsWithObj = result.fieldMappingsWithObj;
                        this.setFieldForMapping();
                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();

                        setFieldMappingKeyisConfig(fielMappingKeysList);
                    }
                    else{
                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                        this.showMessagePopup('Error', 'Error While Fetching Field Mapping Data', result.returnMessage);
                    }
            })
            .catch(error => {
                this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                console.log('error in getTemplateData apex callout : ', {error});
            })
        } catch (error) {
            console.log('error in templateBuilder > getFieldMappingKeys ', error.stack);
            
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

    onChangeTempDetail(event){
        try {
            this.editedTempDetail[event.currentTarget.dataset.field] = event.target.value;
            console.log('value : ', this.editedTempDetail[event.currentTarget.dataset.field]);
            // Check if Template Name or Descritopn field are is empty or not...
            // If any of field is empty then disable done btn...
            if(this.editedTempDetail.Template_Name__c != null && this.editedTempDetail.Template_Name__c != ''
            && this.editedTempDetail.Description__c != null && this.editedTempDetail.Description__c !=  ''){
                this.disableDeatilSave =  false;
            }
            else{
                this.disableDeatilSave =  true;
            }
            console.log('this.disableDeatilSave : ', this.disableDeatilSave);
        } catch (error) {
            console.error('error in templateBuilder.onChangeTempDetail : ',error.stack);
        }
    }

    // when user active-inactive using toggle button.
    changeStatus(event){
        try {
            this.editedTempDetail.Template_Status__c = event.target.checked;
        } catch (error) {
            console.error('error in templateBuilder.changeStatus : ',error.stack);
        }
    }

    setTempDetail(){
        this.editedTempDetail.Template_Name__c = this.templateRecord.Template_Name__c;
        this.editedTempDetail.Description__c = this.templateRecord.Description__c;
        this.editedTempDetail.Template_Status__c = this.templateRecord.Template_Status__c;
    }

    handleCopyFieldKey(event){
        try {
            var fieldName = event.currentTarget.dataset.fieldname;

            const textarea = document.createElement('textarea');
            textarea.value = event.currentTarget.dataset.fieldkey;
            document.body.appendChild(textarea);
            textarea.select();

            navigator.clipboard.write([
                new ClipboardItem({
                    // 'text/html': new Blob([span.outerHTML], { type: 'text/html' }),
                    'text/plain': new Blob([textarea.value], { type: 'text/plain' })
                })
            ]);


            // textarea.select();
            // copyText.setSelectionRange(0, 99999); // For mobile devices
            // navigator.clipboard.writeText(textarea.value);
            // copyText.setSelectionRange(0, 0); // For mobile devices
            document.body.removeChild(textarea); 

            const fieldKeyTD = this.template.querySelectorAll(`[data-name="fieldTD"]`);
            fieldKeyTD.forEach(ele => {
                if(ele.dataset.fieldtd == fieldName){
                    ele.classList.add('copied');
                    setTimeout(() => {
                        ele.classList.remove('copied');
                    }, 1001);
                }
                else{
                    ele.classList.remove('copied');
                }
            });
            
        } catch (error) {
            console.log('error in templateBuilder.handleCopyFieldKey : ', error.stack);
            
        }
    }

    // Set Section Over TExt On Field Key Div....
    handleSetSection(event){
        try {
            // Add section on Field Key Div text...
            var range = document.createRange();
            range.selectNode(event.target);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        } catch (error) {
            console.log('error in templateBuilder.handleSetSection : ', error.stack);
            
        }
    }

    handleSouceObjSelect(event){
        try {
            if(event.detail.length){
                this.objectName = event.detail[0];
            }
            else{
                this.objectName = this.baseObject;
            }
            this.setFieldForMapping();
        } catch (error) {
            console.log('error in templateBuilder.handleSouceObjSelect : ', error.stack);
        }
    }

    // If your img not stored in salsoforce it will not display in PDF... To Resolve this issue we conducting following process...
    // This method first check if any blob img are availabe in template data...
    // if blob img available in template data then code will create conventVesrion of that img and replace img scr attribute with contentVersion's versionDataUrl...
    // and Then save modified template data in backend...
    saveTemplateData(){
        try {
            this.isSpinner = true;
            var templateData = $(this.contentEditor).summernote('code')

            const tempEditor = document.createElement('div');         // Create A temparary DOM element to fetch all imgs...
            tempEditor.innerHTML = templateData;
            var imgs = tempEditor.querySelectorAll('img');            // Query All Img From Template data
                if(imgs.length){
                        var imgToinset = [];
                        imgs.forEach(ele => {
                            // Img with external URL src...
                            // if img have data-id attribute menas it is stored in salesforce...
                            if(ele.src.startsWith("http") && !ele.hasAttribute('data-id')){
                                // ele.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAAXNSR0IArs4c6QAAAOVJREFUSEvtlEEWgyAMRIeb1ZO1PZnejBorfSFMSFy4KyufD36GmYSCG1e5kY00vAKvU8hWgC0jKgU/wU8FfO8HWzG3Tha+8/tVEN86hFdgBfBolqjvUP0UXr9Qgcs6YNqiSH0E16oXCZIV9Ex34QYi5xn8dyNWYAbXqmdwSZZy6E+iWnuuc2iCabgefGg90i2dE0z9ACcDkxlG6n0Hd+zQcBn71vNDUavewm2IHbgAS3CzznsL97zWgc4EdJ1zBZ71/pgH2Wzh8tLp1y8LpC3JukUCc0ObVBve+fBVvCpd7//DqXsfyMRFGIU5yO0AAAAASUVORK5CYII=';
                                // ele.setAttribute('alt', 'external image not allowd.');
                                // ele.setAttribute('data-warning','warning');
                                // ele.style = "width: 20px;"
                                const divEle = document.createElement('span');
                                divEle.style = 'color : #565656; border-bottom: 0.5px solid red;';
                                divEle.innerText = `? external image not allowd.`;
                                ele.parentNode.replaceChild(divEle, ele);
                            }
                            // Img with base64 src...
                            if(ele.src.startsWith('data')){            
                                var base64 = ele.src.split(",")[1];
                                var currentTime = new Date().getTime();
                                var imgIndex = 'img--' + currentTime
                                imgToinset.push({
                                    imgIndex : `img-${imgIndex}`,
                                    base64 : base64,
                                    src : null,
                                })
                                ele.setAttribute('data-imgid', `img-${imgIndex}`);
                            }
    
                        });
    
                        console.log('imgToinset : ', imgToinset.length);
                        if(imgToinset.length){
                            insertImgAsContentVersion({imgToInsert : imgToinset, templateId : this.templateRecord.Id})
                            .then(result =>{
                                console.log('result => ', result);
                                if(result){
                                    result.forEach(ele => {
                                        // after inserting image in content version, we need to update the src of the image in tempEditor
                                        let imgToUpdate = imgToinset.find(img => img.imgIndex === ele.imgIndex);
                                        if (imgToUpdate) {
                                            imgToUpdate.src = ele.src;
                                            let imgElement = tempEditor.querySelector(`[data-imgid="${imgToUpdate.imgIndex}"]`);
                                            if (imgElement) {
                                                imgElement.src = ele.src;
                                                imgElement.setAttribute('data-id', ele.id);
                                                imgElement.style = imgElement.style + "max-width : 100%;";
                                            }
                                        }
                                    });
                                    // save Modified Template data...
                                    this.saveTemplateValue(tempEditor.innerHTML);
                                }
                                else{
                                    this.saveTemplateValue(tempEditor.innerHTML);
                                }
                            })
                            .catch(error =>{
                                console.log('error in insertImgAsContentVersion apex : ', {error});
                                this.saveTemplateValue(tempEditor.innerHTML);
                            })
                        }
                        else{
                            this.saveTemplateValue(tempEditor.innerHTML);
                        }
                    }
                    else{
                        // If Template value doesn't have any img then save original Template value...
                        this.saveTemplateValue(templateData);
                }


        } catch (error) {
            console.log('error in templateBuilder.saveTemplateData :', error.stack);
        }
    }

    saveTemplateValue(templateData){
        try {
            var quillEditor = this.template.querySelector('.ql-editor');

            // Separeate Template Data By Long TExt area Length....
                var splitLength = 130000;
                var templateValuePortion = [];
                var valuePartion = Math.ceil(templateData.length / splitLength);
                for(var i = 1; i<= valuePartion; i++){
                    var startIndex = (i - 1)*splitLength ;
                    var endIndex = i ==  valuePartion ? templateData.length : (i * splitLength);
                    templateValuePortion.push(templateData.substring(startIndex, endIndex));
                }

                // TO Manage Template Data Image's Content Version...on Template Reocrd...
                const tempEditor = document.createElement('div');         // Create A temparary DOM element to fetch all imgs...
                tempEditor.innerHTML = templateData;
                var contentVersionToBe = new Set();                     // Store all Available Content version img to match with availabe content version for this template...
                var imgs = tempEditor.querySelectorAll('img');            // Query All Img From Template data
                if(imgs.length){
                    imgs.forEach(ele => {
                        // get all content version ids.. to manage images in content version...
                        if(ele.hasAttribute('data-id')){
                            contentVersionToBe.add(ele.dataset.id);
                        }
                    })
                }
                console.log('contentVersionToBe : ', contentVersionToBe.size);

                // Call Apex Method to save Template...
                saveTemplateApex({templateRecord : this.templateRecord, templateValues : templateValuePortion, contentVersionIds : Array.from(contentVersionToBe)})
                .then(result => {
                    console.log('result of saveTemplateApex : ', result);
                    if(result){
                        $(this.contentEditor).summernote('code', templateData);
                    }
                    this.isSpinner = false;
                })
                .catch(error => {
                    console.log('error in saveTemplateApex : ', error.stack);
                    this.isSpinner = false;
                })

        } catch (error) {
            console.log('error in templateBuilder.saveTemplateValue : ', error.stack);
            this.isSpinner = false;
        }
    }
    
    closeEditTemplate(){
        try {
            // this.dispatchEvent(new CustomEvent('closeedittemplate'));
            this.navigateToComp(navigationComps.home);
        } catch (error) {
           console.log('error in templateBuilder.closeEditTemplate : ', error.stack)
        }
    }

    setFieldForMapping(){
        try {
            this.field_Vs_KeyList = this.fieldMappingsWithObj.find(ele =>  ele.name == this.objectName).fieldMappings;

            // If Search value is not null, filter Field_Vs_KeysList based on search value...
            if(this.searchFieldValue !== undefined && this.searchFieldValue !== null && this.searchFieldValue != ''){
                this.field_Vs_KeyList = this.field_Vs_KeyList.filter((ele) => {
                    return ele.label.toLowerCase().includes(this.searchFieldValue) || ele.key.toLowerCase().includes(this.searchFieldValue);
                })
            }

        } catch (error) {
            console.log('error in templateBuilder.setFieldForMapping : ', error.stack)
        }
    }

    activeTab(event){
        try {
            this.activeTabName = event.currentTarget.dataset.name;
            this.setActiveTab();
            this.SetCSSbasedonScreenChangeIn();
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

            const sections = this.template.querySelectorAll('.tabSectionArea');
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

    toggleFieldMap(){
        try {
            this.isMappingOpen = !this.isMappingOpen;
            var fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
            var toggleFieldMapping =  this.template.querySelector('.toggleFieldMapping');
            if(fieldMappingContainer && toggleFieldMapping){
                if(this.isMappingOpen){
                    fieldMappingContainer.classList.add('openFieldMapping');
                }
                else{
                    fieldMappingContainer.classList.remove('openFieldMapping');
                }
                toggleFieldMapping.style = this.isMappingOpen ? `width : 0px !important; padding: 0px; opacity : 0;` : '';
            }
        } catch (error) {
            console.log('error in toggleFieldMap : ', error.stack);
        }
    }

    // ====== ====== ========= preview Template Methods ===== ====== ====== =======

    previewTemplate_3(){
        try {
            this.isPreview = true;
            this.isSpinner = true;
            var quillEditor = this.template.querySelector('.ql-editor');
            if(quillEditor){
                var templateData = quillEditor.innerHTML;

                
                var ContainerWidth = 792;
                var ContainerHeight = 792/0.707;
                var contanierPaddingTop = 70;
                var contanierPaddingBottom = 48;
                var contanierPaddingInline = 67;
                var qlEditorWidth = ContainerWidth - (2 * contanierPaddingInline);
                var qlEditorHeight = ContainerHeight - contanierPaddingTop - contanierPaddingBottom;

                console.log('qlEditorHeight : ', qlEditorHeight);

                const temp_qlEditor_container = document.createElement("div");
                temp_qlEditor_container.classList.add('ql-container');
                temp_qlEditor_container.classList.add('ql-snow');
                temp_qlEditor_container.style = `padding-block: 70px 48px;
                                                padding-inline: 67px;
                                                width: fit-content;
                                                height: max-content;
                                                margin-inline: auto;
                                                background: white;
                                                margin-bottom: 0.5rem;
                                                border: 0.2px solid #0000003d !important;`;

                const temp_qlEditor = document.createElement("div");
                temp_qlEditor.style = `width: ${qlEditorWidth}px !important; 
                                        padding: 0px !important;
                                        height: max-content;
                                        margin : 0px;`;
                temp_qlEditor.classList.add('ql-editor');
                temp_qlEditor.innerHTML = templateData;
                temp_qlEditor_container.appendChild(temp_qlEditor);
                document.body.appendChild(temp_qlEditor_container);

                var actualHeight = temp_qlEditor.clientHeight
                var pageCount = Math.ceil(actualHeight / qlEditorHeight);

                console.log('actualHeight : ', actualHeight);
                console.log('qlEditorHeight : ', qlEditorHeight);


                var lastPageHeight = `${actualHeight - (qlEditorHeight*(pageCount-1)) }`;

                var childeNodes = temp_qlEditor.childNodes;
                var page_vs_values = [];
                for(var page = 1; page <= pageCount; page++ ){

                    var top = (qlEditorHeight * (page - 1)) + 86.8;
                    var bottom = (qlEditorHeight * page) + 86.8;

                    console.log(' === ==== === page ', page, '==== ==== ====');

                    var values = [];
                    for(var i = 0; i<childeNodes.length; i++){
                        var child_rect = childeNodes[i].getBoundingClientRect();
                        if(child_rect.top >= top &&
                            child_rect.bottom <= bottom){
                                console.log(' === Node ', i, '==== ', child_rect.top,' x ',child_rect.bottom);
                                // console.log('child_rect Top : ',  child_rect.top, ' == bottom : ', child_rect.bottom);
                                values.push(childeNodes[i].outerHTML);
                        }

                        // Element which Cut by Page brake at page end...
                        if( child_rect.top > top &&
                            child_rect.top < bottom && 
                            child_rect.bottom > bottom){
                                console.log(' === Node ', i, '==== ', child_rect.top,' x ',child_rect.bottom);
                                if(childeNodes[i].hasChildNodes()){
                                    var childToAdd = childeNodes[i].cloneNode(false);
                                    console.log('childToAdd : ', childToAdd);
                                    var innerChilds_1 = childeNodes[i].childNodes;
                                    
                                    for(var j=0 ;j < innerChilds_1.length; j++) {
                                        var innerChild1_rect = innerChilds_1[j].getBoundingClientRect();
                                        if(innerChild1_rect.bottom < bottom){
                                            // childToRemove.push(j);
                                            childToAdd.appendChild(innerChilds_1[j]);
                                            console.log(' === Node ', i, '==== at end innerNode', j, '==== ');
                                        }
                                    }
                                    console.log(childToAdd);
                                    values.push(childToAdd.outerHTML);
                                }
                        }

                        // Element which Cut by Page brake at page Satrting...
                        if( child_rect.top < top &&
                            child_rect.bottom > top && 
                            child_rect.bottom <= bottom){
                                if(childeNodes[i].hasChildNodes()){
                                    var childToAdd = childeNodes[i].cloneNode(false);
                                    var innerChilds_1 = childeNodes[i].childNodes;
                                    for(var j=0 ;j < innerChilds_1.length; j++) {
                                        var innerChild1_rect = innerChilds_1[j].getBoundingClientRect();
                                        if(innerChild1_rect.top > top){
                                            childToAdd.appendChild(innerChilds_1[j]);
                                            console.log(' === Node ', i, '====  at start innerNode', j, '==== ');
                                        }
                                    }
                                    console.log(childToAdd);
                                    values.push(childToAdd.outerHTML);
                                }
                        }
                    }
                    page_vs_values.push({'page' : page, 'values' : values});
                }

                for(var page = 1; page <= pageCount; page++ ){
                    const qlEditor_outher = document.createElement("div");
                    qlEditor_outher.style = `   padding-block: 70px 48px;
                                                padding-inline: 67px;
                                                width: fit-content;
                                                height: max-content;
                                                margin-inline: auto;
                                                background: white;
                                                margin-bottom: 0.5rem;
                                                border: 0.2px solid #0000003d !important;`;
                    qlEditor_outher.classList.add('ql-container');
                    qlEditor_outher.classList.add('ql-snow');
                    // margin-bottom : ${page == pageCount ? 56 : 0}px;
    
                    var qlEditorStyle = `   width: ${qlEditorWidth}px !important;
                                            height : ${page == pageCount ? lastPageHeight : qlEditorHeight}px;
                                            padding: 0px !important;
                                            overflow : hidden;`;
                    const qlEditor_page = document.createElement("div");
                    qlEditor_page.classList.add('ql-editor');
                    qlEditor_page.setAttribute( "data-page" , 'page' + i );
                    qlEditor_page.style = qlEditorStyle;
                    page_vs_values.find((ele) => ele.page == page).values.forEach(ele => {
                        qlEditor_page.innerHTML += ele
                    })
                    qlEditor_outher.appendChild(qlEditor_page);
                    setTimeout(() => {
                        const previewContainer = this.template.querySelector(`[data-name="previewContainer"]`);
                        previewContainer.appendChild(qlEditor_outher);
                        // previewContainer.appendChild(temp_qlEditor_container);

                        this.isSpinner = false;
                    }, 1000);
                }
                temp_qlEditor_container.remove();
            }
        } catch (error) {
            this.isSpinner = false;
            console.log('error in templateBuilder.previewTemplate : ', error.stack);
        }
    }

    previewTemplate_4(){
        try {
            // var paraData = {
            //     'templateId' : this.templateRecord.Id,
            //     'Object_API_Name__c' : this.templateRecord.Object_API_Name__c,
            //     'recordId' : '001F300001hcDvyIAE',
            //     'useMode' : 'preview',            }
            // var paraDataStringify = JSON.stringify(paraData);

            // this.vfPageSRC = '/apex/DocGeniusPDFGeneratorPage?paraData=' + paraDataStringify;
            // console.log('vfPageSRC : ', this.vfPageSRC);

            this.isPreview = true;
            // this.isSpinner = true;

            // 50% --> 410px
            //      {pre 1% -- 14px}
            // 55% --> 480px
            //     {per 1% -- 14.4}
            // 60% --> 552px
            //     {per 1% -- 14.4}
            // 65% --> 624px
            //     {per 1% -- 14.4}
            // 70% --> 694px
            //     {per 1% -- 14.4}
            // 75% --> 766px

        } catch (error) {
            console.log('error in templateBuilder.previewTemplate_4 : ', error.stack);
        }
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

    exportTemplate(){
        try {

            var paraData = {
                'templateId' : this.templateRecord.Id,
                'Object_API_Name__c' : this.templateRecord.Object_API_Name__c,
                'recordId' : '001F300001hSNKbIAO',
                'docType' : 'PDF',
                'useMode' : 'download',
            }
            var paraDataStringify = JSON.stringify(paraData);

            var redirectURL = '/apex/DocGeniusPDFGeneratorPage?paraData=' + paraDataStringify;
            window.open(redirectURL, "_blank");

        } catch (error) {
            console.log('error in templateBuilder.exportTemplate : ', error.stack);
        }
    }

    toogleAccordianItems(event){
        try {

            function getParentElement(node){
                if(node.parentElement.classList && node.parentElement.classList.contains('accorionContainer')){
                    return node.parentElement;
                }
                else{
                    return getParentElement(node.parentElement);
                }
            }
                
            console.log(getParentElement(event.currentTarget));
            var accordianContainer = getParentElement(event.currentTarget);

            var accordianItemSection = accordianContainer.querySelector('.accordianItemSection');
            var toggleBtn = accordianContainer.querySelector('.accordianToggleBtn');
            if(!accordianItemSection.classList.contains('open')){
                accordianItemSection.classList.add('open');
                toggleBtn.classList.add('rotate90');
            }
            else{
                accordianItemSection.classList.remove('open');
                toggleBtn.classList.remove('rotate90');
            }



        } catch (error) {
            console.log('error in templateBuilder.toogleAccordianItems : ', error.stack);
        }
    }

    toogleFieldSearch(event){
        try {
            if(event.currentTarget.dataset.action == 'open'){
                this.template.querySelector('.fieldSearchContainer').classList.add('open');
            }
            else{
                this.template.querySelector('.fieldSearchContainer').classList.remove('open');
            }
        } catch (error) {
            console.log('error in templateBuilder.toogleFieldSearch : ', error.stack);
        }
    }

    searchObjFields(event){
        try {
            this.searchFieldValue = event.target.value;
            this.setFieldForMapping();
        } catch (error) {
            console.log('error in templateBuilder.searchObjFields : ', error.stack);
        }
    }

    handleComboboxFocus(event){
        // console.log('event : ', event.type);
    }


    // ====== ======= ======== ======= ======= ====== GENERIC Method ====== ======= ======== ======= ======= ======
     // Generetic Method to test Message Popup and Toast
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