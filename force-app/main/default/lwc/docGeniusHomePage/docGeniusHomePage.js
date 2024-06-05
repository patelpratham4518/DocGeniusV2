import { LightningElement, api, track, wire } from "lwc";
import docGeniusImgs from "@salesforce/resourceUrl/homePageImgs";
import previewIcon from "@salesforce/resourceUrl/previewIcon";
import getTemplateList from '@salesforce/apex/DocGeniusHomePageController.getTemplateList';
import updateTemplate from '@salesforce/apex/DocGeniusHomePageController.updateTemplate';
import deleteTemplate from '@salesforce/apex/DocGeniusHomePageController.deleteTemplate';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import Template_Object from '@salesforce/schema/Template__c';
import Template_Type_FIELD from '@salesforce/schema/Template__c.Template_Type__c';
import { setRefrenceDates } from './refrenceDateMethods.js'
export default class DocGeniusHomePage extends LightningElement {


    @track isDisplayOption = false;

    @track templateList = [];
    @track objectList = [];
    @track templateTypeList = [];
    @track filterDateTypeList = [];

    @track dispalyedTemplateList = [];
    
    defaultSortField = 'Template_Name__c';
    @track selectedFieldToSort = this.defaultSortField;
    @track sortAS = 'asc';
    @track selectedObjects = [];
    @track selectedTemplates = [];
    @track selectedDateToFilter = '';
    @track selectedRefrenceTime = '';
    @track selectedRange = {
        fromDate : '',
        toDate : ''
    }
    @track selectedTemplateId;
    @track selectedObjectName;
    @track selectedTemplate = {};
    @track dataLoaded = false;
    @track isSpinner = true;
    @track isCreateTemplate = false;

    toggelTemplateId = '';
    isToggelActive = false;
    deleteTemplateId = ''
    isDeleteActive = false;

    isEditSimpleTemplate = false;
    isEditCSVTemplate = false;
    isEditDnDTemplate = false

    @track sortingFiledList = [
        {label : 'Template Name', value : 'Template_Name__c'},
        {label : 'Created Date', value : 'CreatedDate'},
        {label : 'Last Modified Date', value : 'LastModifiedDate'},
        {label : 'Object Name', value : 'Object_API_Name__c'},
    ];
    @track refrenceTimeList = [
        {label : 'THIS WEEK', value : 'THIS_WEEK'},
        {label : 'LAST WEEK', value : 'LAST_WEEK'},
        {label : 'THIS MONTH', value : 'THIS_MONTH'},
        {label : 'LAST MONTH', value : 'LAST_MONTH'},
        // {label : 'THIS YEAR', value : 'THIS_YEAR'},
        // {label : 'LAST YEAR', value : 'LAST_YEAR'},
    ]

    refrenceDates = {
        todayDate : '',
        firstDayofThisWeek : '',
        lastDayofThisWeek : '',
        firstDayofPreviousWeek : '',
        lastDayOfPreviousWeek : '',
        firstDayofPreviousMonth : '',
        lastDayOfPreviousMonth : '',
        firstDayofThisMonth : '',
        lastDayofThisMonth : ''
    }

    imgSrc = {
        'TemplateCardBg': '',
        'HomBg' : '',
        'HomeNoRecordBg' : '',
        'DocGeniusLogo' : '',
        'createTemplateImg': '',
        'emptyState' : '',
    };

    get DocGeniusLogo(){
        return this.imgSrc.DocGeniusLogo;
    }
    get createTemplateImg(){
        return this.imgSrc.createTemplateImg;
    }

    get emptyStateImg(){
        return this.imgSrc.emptyState;
    }

    get privewBtnIcon(){
        return previewIcon;
    }

    get isTemplates(){
        return this.templateList.length > 0 || this.isSpinner ? true : false;
    }

    get clearRangeDates(){
        return (this.selectedRange.fromDate != '' ||this.selectedRange.toDate != '') ? true : false;
    }

    // Get Template__c Object Information...
    @wire(getObjectInfo, { objectApiName: Template_Object })
    objectInfo;

    // Get Picklist values form Template_Type__c FIELD from Template__c Object
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: Template_Type_FIELD })
    wiredTemplateTypeValues({ data }) {
        if (data) {
            this.templateTypeList = this.mapPicklistValues(data);
        }
    }

    connectedCallback(){
        try {
            // Set refrence field to filter fuctionality...
            // this.setRefrenceDates();
            this.refrenceDates = setRefrenceDates();

            // Get data from Backed...
            this.getTemplateList_Apex();

            // storing static resouce in single array...
            for(var key in this.imgSrc){
                this.imgSrc[key] = docGeniusImgs + '/' + key + '.png';
            }

        } catch (error) {
            console.error('error in method connectedCallback : ', error.stack);
        }
    }

    // generic method to  --> Mapping picklist value as key of label and value
    mapPicklistValues(data) {
        return data.values.map(item => ({
            label: item.label,
            value: item.value
        }));
    }

    getTemplateList_Apex(){
        try {
            getTemplateList()
            .then(result => {
                console.log('result : ', result);
                if(result.isSuccess == true){
                    if(result.templateList.length > 0){
                        var templateList = result.templateList;
                        // Add additonal keys for logic implementation...
                        templateList.forEach(ele => {
                            ele['srNo'] = templateList.indexOf(ele) + 1;
                            ele['CreateDate_Only'] = ele.CreatedDate.split('T')[0];
                            ele['LastModifiedDate_Only'] = ele.LastModifiedDate.split('T')[0];
                        });
                        this.templateList = templateList;
                        this.dispalyedTemplateList = JSON.parse(JSON.stringify(this.templateList));
                        this.setSerialNumber();

                    }
                    if(result.objectList.length > 0){
                        this.objectList = result.objectList;
                    }
                    if(result.dateFields.length > 0){
                        this.filterDateTypeList = result.dateFields;
                    }
                    this.dataLoaded = true;
                    this.isSpinner = false;
                }

            })
            .catch(error => {
                console.error('error in apex method getTemplateList : ', error);
            })
        } catch (error) {
            console.error('error in getTemplateList_Apex : ', error.stack);
        }
    }

    // ------- -------- --------- --------- Sorting, Filter and Searching Option Methos - START - -------- ----------- ----------
    // Method to show/hidde options
    toggleOptions(){
        try {
            this.isDisplayOption = !this.isDisplayOption;
            const upperSection = this.template.querySelector('.upperSection');
            const optionContainer = this.template.querySelector('.optionContainer')
            if(this.isDisplayOption){
                upperSection.classList.add('showOptionContainer');

                setTimeout(() => {
                    optionContainer.style = `overflow: visible;`
                }, 400);
                // Interval Time must be match to the transition time for the upperSection;
            }
            else{
                optionContainer.style = ``;

                upperSection.classList.remove('showOptionContainer');
            }

        } catch (error) {
            console.error('error in method showMessagePopup : ', error.stack);
        }
    }

    handleSortSelect(event){
        try {
            this.selectedFieldToSort = event.detail.length > 0 ? event.detail[0].value : '';
        } catch (error) {
            console.error('error in handleSortSelect : ',error.stack);
            
        }
    }

    handleSortAsChange(event){
        try {
            this.sortAS = event.currentTarget.dataset.value;
        } catch (error) {
            console.error('error in handleSortAsChange : ', error.stack);
        }
    }

    handleObjectSelect(event){
        try {
            this.selectedObjects = event.detail;
        } catch (error) {
            console.error('error in handleObjectSelect : ',error.stack);
        }
    }

    handleDateSelect(event){
        try {
            this.selectedDateToFilter = event.detail.length > 0 ? event.detail[0].value : '';
            
        } catch (error) {
            console.error('error in handleDateSelect :  ', error.stack);
        }
    }

    handleDateChange(event){
        try {
            this.selectedRange[event.target.name] = event.target.value;

            if(this.selectedRange.fromDate != '' && this.selectedRange.toDate != ''){
                if(event.target.name == 'toDate'){
                    if(this.selectedRange.toDate < this.selectedRange.fromDate){
                        this.selectedRange.toDate = '';
                        event.target.value = '';
                        this.template.querySelector(`[data-label="toDate"]`).classList.add('errorText');
                        this.showMessageToast('error', '', '"To" Date must be greater or equal to "From" date', 4000);
                    }
                    else{
                        this.template.querySelector(`[data-label="toDate"]`).classList.remove('errorText');
                    }
                }
                else if(event.target.name == 'fromDate'){
                    if(this.selectedRange.fromDate > this.selectedRange.toDate){
                        this.selectedRange.fromDate = '';
                        event.target.value = '';
                        this.template.querySelector(`[data-label="fromDate"]`).classList.add('errorText');
                        this.showMessageToast('error', '', '"From" Date must be less than "To" date', 4000);
                    }
                    else{
                        this.template.querySelector(`[data-label="fromDate"]`).classList.remove('errorText');
                    }
                }
            }
        } catch (error) {
            console.error('error in handleDateChange :  ', error.stack);
        }
    }

    handleSelectTemplate(event){
        try {
            if(event.target.checked){
                this.selectedTemplates.push(event.currentTarget.dataset.value);
            }
            else{
                this.selectedTemplates = this.selectedTemplates.filter(ele => ele != event.currentTarget.dataset.value);
            }
        } catch (error) {
            console.error('error in handleSelectTemplate :  ', error.stack);
        }
    }

    handleRefrecePillClick(event){
        try {
            this.selectedRefrenceTime = event.currentTarget.dataset.value;        

            if(this.selectedRefrenceTime == 'LAST_WEEK'){

                this.selectedRange.fromDate = this.refrenceDates.firstDayofPreviousWeek;
                this.selectedRange.toDate = this.refrenceDates.lastDayOfPreviousWeek;
            }
            else if(this.selectedRefrenceTime == 'THIS_WEEK'){

                this.selectedRange.fromDate = this.refrenceDates.firstDayofThisWeek;
                this.selectedRange.toDate = this.refrenceDates.todayDate;
            }
            else if(this.selectedRefrenceTime == 'LAST_MONTH'){

                this.selectedRange.fromDate = this.refrenceDates.firstDayofPreviousMonth;
                this.selectedRange.toDate = this.refrenceDates.lastDayOfPreviousMonth;
            }
            else if(this.selectedRefrenceTime == 'THIS_MONTH'){

                this.selectedRange.fromDate = this.refrenceDates.firstDayofThisMonth;
                this.selectedRange.toDate = this.refrenceDates.todayDate;
            }
        } catch (error) {
            console.error('error in handleRefrecePillClick :  ', error.stack);
        }
    }

    // When we remove select object from pills..
    removeSelctedObj(event){
        try {
            var unselectedValue = event.currentTarget.dataset.value;

            var unselectedOption = this.selectedObjects.find(ele => ele.value == unselectedValue);

            this.selectedObjects = this.selectedObjects.filter((option) => {
                return option.value != unselectedValue;
            });

            this.template.querySelector(`[data-combox="object"]`).unselectOption(unselectedOption);
        } catch (error) {
            console.error('error inside removeSelctedObj in custome combobox : ', error.stack);
        }
    }

    hanldeRangeDates(){
        try {
            var redios = this.template.querySelectorAll('[name="refrenceTime"]');
            redios.forEach(ele => {
                ele.checked = false;
            });
            this.selectedRefrenceTime = '';
            this.selectedRange.fromDate = '';
            this.selectedRange.toDate = '';
        } catch (error) {
            console.error('error in hanldeClearRefrenceTime : ', error.stack);
        }
    }

    handleFilterApply(event){
        try {

            var isFilter = this.setErrorForRangeDate();
            if(isFilter){
                this.showMessageToast('error', 'Required fields are empty !!!', 'Please fill the required field.', 4000);
            }
            else{
                var selectedObjNames = [];
                this.selectedObjects.forEach(ele =>{
                    selectedObjNames.push(ele.value);
                });
    
                this.dispalyedTemplateList = this.templateList.filter(ele => {
                    var inObject = selectedObjNames.length !== 0 ? selectedObjNames.includes(ele.Object_API_Name__c) : true;
                    var inType = this.selectedTemplates.length !== 0 ? this.selectedTemplates.includes(ele.Template_Type__c) : true;
                    var inDate = true;
                    if(this.selectedDateToFilter != '' && this.selectedDateToFilter){
                        var dateOnly = ele[this.selectedDateToFilter].split('T')[0];
                        inDate = dateOnly >= this.selectedRange.fromDate && dateOnly <= this.selectedRange.toDate;
                    }

                    return (inObject && inType && inDate);
    
                });

                // if sorting field is empty... by default sort as template name...
                this.selectedFieldToSort = (this.selectedFieldToSort != '' && this.selectedFieldToSort) ? this.selectedFieldToSort : this.defaultSortField;
                this.sortDisplayTemplates();

                this.setSerialNumber();
            }

            
        } catch (error) {
            console.error('error in handleFilterApply : ', error.stack);
        }
    }

    sortDisplayTemplates(){
        try {
            this.dispalyedTemplateList = this.dispalyedTemplateList.sort((a, b) => {
                if(a[this.selectedFieldToSort].toLowerCase() > b[this.selectedFieldToSort].toLowerCase()){
                    return this.sortAS == 'asc' ? 1 : -1;
                }
                if(a[this.selectedFieldToSort].toLowerCase() < b[this.selectedFieldToSort].toLowerCase()){
                    return  this.sortAS == 'asc' ? -1 : 1;
                }
                if(a[this.selectedFieldToSort].toLowerCase() == b[this.selectedFieldToSort].toLowerCase()){
                    
                    if(this.selectedFieldToSort != 'Template_Name__c'){
                        if(a['Template_Name__c'].toLowerCase() == b['Template_Name__c'].toLowerCase()){
                            if(a['Template_Name__c'].toLowerCase() > b['Template_Name__c'].toLowerCase()){
                                return 1;
                            }
                            if(a['Template_Name__c'].toLowerCase() < b['Template_Name__c'].toLowerCase()){
                                return -1;
                            }
                            if(a['Template_Name__c'].toLowerCase() == b['Template_Name__c'].toLowerCase()){
                                return 0;
                            }
                        }
                    }
                    else{
                        return 0;
                    }
                }

            })
        } catch (error) {
            console.error('error in sortDisplayTemplates : ', error.stack);
        }
    }

    setErrorForRangeDate(){
        try {
            if(this.selectedDateToFilter != '' || this.selectedRange.fromDate != '' ||  this.selectedRange.toDate != ''){
                if(this.selectedRange.fromDate == ''){
                    this.template.querySelector(`[data-name="fromDate"]`).classList.add('errorBorder');
                }
                else{
                    this.template.querySelector(`[data-name="fromDate"]`).classList.remove('errorBorder');
                }

                if(this.selectedRange.toDate == ''){
                    this.template.querySelector(`[data-name="toDate"]`).classList.add('errorBorder');
                }
                else{
                    this.template.querySelector(`[data-name="toDate"]`).classList.remove('errorBorder');
                }

                if(this.selectedDateToFilter == ''){
                    this.template.querySelector(`[data-combox="date"]`).isInvalidInput(true);
                }
                else{
                    this.template.querySelector(`[data-combox="date"]`).isInvalidInput(false);
                }
                
                if(this.selectedDateToFilter != '' && this.selectedRange.fromDate != '' &&  this.selectedRange.toDate != ''){
                    return false;
                }
                else{
                    return true;
                }
            }
            else{
                this.template.querySelector(`[data-name="fromDate"]`).classList.remove('errorBorder');
                this.template.querySelector(`[data-name="toDate"]`).classList.remove('errorBorder');
                this.template.querySelector(`[data-combox="date"]`).isInvalidInput(false);
                return false;
            }
            
        } catch (error) {
            console.error('error in setErrorForRangeDate : ', error.stack);            
        }
        
    }

    // Set Serial Number after Searching, Sorting and Filteration...
    setSerialNumber(){
        var dispalyedTemplateList = JSON.parse(JSON.stringify(this.dispalyedTemplateList));
        dispalyedTemplateList.forEach(ele => {
            ele['srNo'] = dispalyedTemplateList.indexOf(ele) + 1;
        });
        this.dispalyedTemplateList = dispalyedTemplateList;

        var templateList = JSON.parse(JSON.stringify(this.templateList));
        templateList.forEach(ele => {
            ele['srNo'] = templateList.indexOf(ele) + 1;
        });
        this.templateList = templateList;
    }

    hanldeTemplateSearch(event){
        try {
            var searchValue = (event.target.value).toLowerCase();
            
            this.dispalyedTemplateList = this.templateList.filter((ele) => {
                 return ele.Template_Name__c.toLowerCase().includes(searchValue);
            });

            this.setSerialNumber();
            
        } catch (error) {
            console.error('error in hanldeTemplateSearch : ', error.stack);
        }
    }

    // ------- -------- --------- --------- Sorting, Filter and Searching Option Methos - START - -------- ----------- ----------


    // when user active-inactive using toggle button.
    handleChangeActiveness(event){
        try {
            this.toggelTemplateId = event.currentTarget.dataset.id;
            this.isToggelActive = true;
            if(event.target.checked){
                this.showMessagePopup('Warning', 'Warning !!!', 'Do you want to Active this Template');
            }
            else{
                this.showMessagePopup('Warning', 'Warning !!!', 'Do you want to Inactive this Template');
            }
        } catch (error) {
            console.error('error in handleChangeActiveness : ',error.stack);
        }
    }

    handleCreateTemplate(){
        try {
            this.isCreateTemplate = true;
        } catch (error) {
            console.error('error in handleCreateTemplate : ',error.stack);
        }
    }

    handlePreviewTemplate(event){
        try {
            console.log('handlePreviewTemplate');
            this.showMessagePopup('info', 'Under Construction.. !!', 'This Functionality is still in Progess...');
        } catch (error) {
            console.error('error in handlePreviewTemplate : ',error.stack);
        }
    }

    handleDeleteTemplate(event){
        try {
            this.deleteTemplateId = event.currentTarget.dataset.id;
            console.log('this.deleteTemplateId : ', this.deleteTemplateId);
            this.isDeleteTemplate = true;
            this.showMessagePopup('Warning', 'Conform to Delete ?', 'Do you want to Delete this Template');
            
        } catch (error) {
            console.error('error in handleDeleteTemplate : ',error.stack);
        }
    }

    // As recevied confirmation from child popup messge compoent...
    handleConfimation(event){
        try {
            if(this.isToggelActive){
                const toggelInput = this.template.querySelector(`[data-toggel="${this.toggelTemplateId}"]`);
                if(event.detail){
                    this.dispalyedTemplateList.forEach(ele => { 
                        ele.Template_Status__c = ele.Id == this.toggelTemplateId ? toggelInput.checked : ele.Template_Status__c;
                    })
                    this.templateList.forEach(ele =>{
                        ele.Template_Status__c = ele.Id == this.toggelTemplateId ? toggelInput.checked : ele.Template_Status__c;
                    });

                    // Update Template in Backend...
                    updateTemplate({ templateId : this.toggelTemplateId, isActive : toggelInput.checked})
                    .then(result => {
                        console.log('result on updateTemplate : ', result);
                    })
                    .catch(error => {
                        console.error('error in apex method  updateTemplate: ', {error});
                    })
                }
                else{
                    toggelInput.checked = !toggelInput.checked;
                }
                this.isToggelActive = false;
            }
            if(this.isDeleteTemplate && event.detail){
                // If recived Confirm from user ... Delete Template from backend...
                this.isSpinner = true;
                deleteTemplate({templateId : this.deleteTemplateId})
                .then(result => {
                    console.log('result on deleteTemplate : ', result);
                    if(result == 'deleted'){
                        // Remove Template from TemplateList...
                        this.dispalyedTemplateList = this.dispalyedTemplateList.filter(ele => ele.Id != this.deleteTemplateId);
                        this.templateList = this.templateList.filter(ele => ele.Id != this.deleteTemplateId);
                        
                        // Set Serial Number after Deleting...
                        this.setSerialNumber();

                        this.isDeleteTemplate = false;
                        this.isSpinner = false;

                        this.showMessageToast('Success', 'Template Deleted.', 'Your template deleted successfully.', 5000);
                    }
                    this.isSpinner = false;
                })
                .catch(error => {
                    console.error('error in apex method  deleteTemplate: ', {error});
                    this.isSpinner = false;
                })
            }
        } catch (error) {
            console.error('error in handleConfimation : ', error.stack);
        }
    }

    handleTemplateEdit(event){
        try {
            this.selectedTemplateId = event.currentTarget.dataset.id;
            this.selectedTemplate = this.templateList.find(ele => { ele.Id === event.currentTarget.dataset.id});
            this.selectedObjectName = event.currentTarget.dataset.objapi;
            // If Option Container Open.. then close it before open edit section...
            if(this.isDisplayOption){
                this.toggleOptions();
            }
            if(event.currentTarget.dataset.type == 'Simple Template'){
                this.isEditSimpleTemplate = true;
            }
            else if(event.currentTarget.dataset.type == 'CSV Template'){
                this.isEditCSVTemplate = true;
            }
            else if(event.currentTarget.dataset.type == 'Drag&Drop Template'){
                this.isEditDnDTemplate = true;
            }

        } catch (error) {
            console.error('error in handleTemplateEdit : ', error.stack);
        }
    }


    // after Create Template SuccessFully...
    handleAfterSave(event){
        try {
            this.isCreateTemplate = false
            this.selectedTemplateId = event.detail.templateId;
            this.selectedObjectName = event.detail.objectName;
            if(event.detail.type == 'Simple Template'){
                this.isEditSimpleTemplate = true;
            }
            else if(event.detail.type == 'CSV Template'){
                this.isEditCSVTemplate = true;
            }
            else if(event.detail.type == 'Drag&Drop Template'){
                this.isEditDnDTemplate = true;
            }
            this.getTemplateList_Apex();
        } catch (error) {
            console.error('error inside handleAfterSave ', error.stack);
        }
    }


    closeDandDEditTemplate(){
        try {

            this.isEditDnDTemplate = false;
            this.selectedTemplateId = null;
            this.selectedObjectName = null;
            this.isSpinner = true;

            this.getTemplateList_Apex();

        } catch (error) {
            console.error('error in closeSimpleEditTemplate : ', error.stack);
        }
    }


    closeCreateTemplate(){
        try {
            this.isCreateTemplate = false;
        } catch (error) {
            console.error('error in closeCreateTemplate : ', error.stack);
        }
    }

    closeSimpleEditTemplate(){
        try {
            this.isEditSimpleTemplate = false;
            this.selectedTemplateId = null;
            this.selectedObjectName = null;
            this.isSpinner = true;
            this.getTemplateList_Apex();
        } catch (error) {
            console.error('error in closeSimpleEditTemplate : ', error.stack);
        }
    }

    closeCSVEditTemplate(){
        try {
            this.isEditCSVTemplate = false;
            this.selectedTemplateId = null;
            this.selectedObjectName = null;
            this.isSpinner = true;
            this.getTemplateList_Apex();
        } catch (error) {
            console.error('error in closeSimpleEditTemplate : ', error.stack);
        }
    }

        // setRefrenceDates(){
        //     try {

        //         let todayDate = new Date();

        //         let firstDayofThisWeek = new Date(todayDate);
        //         firstDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay());

        //         let lastDayofThisWeek = new Date(todayDate);
        //         lastDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay() + 6);

        //         let lastDayOfPreviousWeek = new Date(todayDate);
        //         lastDayOfPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 1);

        //         let firstDayofPreviousWeek = new Date(todayDate);
        //         firstDayofPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 7);

        //         let firstDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 2);
        //         let lastDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);

        //         let lastDayOfPreviousMonth = new Date(todayDate);
        //         lastDayOfPreviousMonth.setDate(todayDate.getMonth() - todayDate.getMonth());

        //         let firstDayofPreviousMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 2);


        //         this.refrenceDates.todayDate = todayDate.toISOString().split('T')[0];
        //         this.refrenceDates.firstDayofThisWeek = firstDayofThisWeek.toISOString().split('T')[0];
        //         this.refrenceDates.lastDayofThisWeek = lastDayofThisWeek.toISOString().split('T')[0];
        //         this.refrenceDates.lastDayOfPreviousWeek = lastDayOfPreviousWeek.toISOString().split('T')[0];
        //         this.refrenceDates.firstDayofPreviousWeek = firstDayofPreviousWeek.toISOString().split('T')[0];
        //         this.refrenceDates.firstDayofPreviousMonth = firstDayofPreviousMonth.toISOString().split('T')[0];
        //         this.refrenceDates.lastDayOfPreviousMonth = lastDayOfPreviousMonth.toISOString().split('T')[0];
        //         this.refrenceDates.firstDayofThisMonth = firstDayofThisMonth.toISOString().split('T')[0];
        //         this.refrenceDates.lastDayofThisMonth = lastDayofThisMonth.toISOString().split('T')[0];
        //     } catch (error) {
        //         console.error('error in setRefrenceDate : ', error.stack); 
        //     }
        // }

        // ==== ===== ==== Generetic Method to test Message Popup and Toast... === === === === === === ===
        showMessagePopup(Status, Title, Message){
                const messageContainer = this.template.querySelector('c-message-popup')
                if(messageContainer){
                    messageContainer.showMessagePopup({
                        status: Status,
                        title: Title,
                        message : Message,
                    });
                }
        }

        showMessageToast(Status, Title, Message, Duration){
            const messageContainer = this.template.querySelector('c-message-popup')
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