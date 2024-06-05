import { LightningElement, track , api} from 'lwc';
import getFields from '@salesforce/apex/EditCSVTemplateController.getFields';
import saveTemplateFields from '@salesforce/apex/EditCSVTemplateController.saveTemplateFields';
import getTemplateFieldsData from '@salesforce/apex/EditCSVTemplateController.getTemplateFieldsData';
import validateRelatedObject from '@salesforce/apex/EditCSVTemplateController.validateRelatedObject';
import testQueryMethod from '@salesforce/apex/EditCSVTemplateController.testQueryMethod';
import {NavigationMixin} from 'lightning/navigation'

export default class EditCSVTemplate extends NavigationMixin(LightningElement) {

    components = {
        simpleTemplateBuilder : 'templateBuilder',
        csvTemplateBuilder : 'editCSVTemplate',
        dNdTemplateBuilder : 'editDragDropTemplate',
        home : 'docGeniusHomePage',
    }

    // -=-=- the values we got from the Home page/new template popup -=-=-
    @api objectName;
    @api templateId;

    //-=-=- to Show/hide the Spinner -=-=-
    @track showSpinner;

    //-=-=- To run a function only once, when we want in rendered callback -=-=-
    initialRender = true;
    initialFilters = true;
    initialSorts = true;
    
    //-=-=- Field Selection -=-=-
    @track fieldOptions = [];
    searchKey = '';
    @track SearchFieldOptions = [];
    @track selectedFields = [];
    @track toAddSelected = [];
    @track toRemoveSelected = [];

    //-=-=- Filter/Sort/Logic Selection -=-=-
    separatedData = '';
    generatedQuery = '';
    filtersCount = 0;
    sortsCount = 0;
    @track limit = 1000000;    
    @track fieldsForFilters = [];
    @track allOperatorOptions = [
        //String
        { label: 'Equals to', value: '=', type: 'default, string,textarea, id, number, phone, date, datetime, email, currency, boolean' },
        { label: 'Not Equals to', value: '!=', type: 'default, string,textarea, id, number, phone, date, datetime, email, currency, boolean' },
        { label: 'Includes', value: 'LIKE', type: 'string, textarea, email' },
        { label: 'Does not Includes', value: 'notLIKE', type: 'string, textarea, email' },
        { label: 'Strarts with', value: 'startLIKE', type: 'string, textarea, phone' },
        { label: 'Ends with', value: 'endLIKE', type: 'string, textarea, email, phone' },
        { label: 'Contains', value: '=', type: 'picklist' },
        { label: 'Does not contain', value: '!=', type: 'picklist' },
        { label: 'Greater Than', value: '>', type: 'number, currency' },
        { label: 'Less Than', value: '<', type: 'number, currency' },
        { label: 'Greater or equal', value: '>=', type: 'number, currency' },
        { label: 'Less or equal	', value: '<=', type: 'number, currency' },
        { label: 'Before', value: '<', type: 'date, datetime' },
        { label: 'After', value: '>', type: 'date, datetime' },
    ];
    @track logicOperators = [
        { label: 'AND', value: 'AND'},
        { label: 'OR', value: 'OR'},
        { label: 'Custom', value: 'Custom'}
    ];
    @track customLogicString ='';
    @track isCustomLogic = false;
    isCustomLogicValid = true;
    @track selectedLogic = 'AND';
    @track showLimitInput = false;
    @track filters = [{
        fieldName: '',
        operator: '',
        value: '',
        type :'',
        inputType : '',
        operators : []
    }];
    @track sorts = [{
        field: '',
        order: ''
    }]

// -=-=- To fetch the Fields for the Object of the template -=-=-
// -=-=- To fetch the Existing fields and filters for this template -=-=-
    connectedCallback(){
        this.showSpinner = true;
        console.log('Object Name :: ' + this.objectName + ' && TemplateID :: '  + this.templateId );
/*
*********************************************************
@Method Name    : getFields
@author         : Kevin Suvagiya
@description    : Method is used to fetch all the fields of the object
@param          :
    1. objName {String} : name of the object
@return         : List<FieldInfoWrapper>  :- including field Label, Api name, Field Type and Picklist values if it has 
********************************************************
*/
        getFields({objName : this.objectName})
        .then((data)=>{
            this.fieldOptions = data.slice().sort((a, b) => a.fieldName.localeCompare(b.fieldName));
            this.fieldsForFilters = this.fieldOptions
                .filter(option => option.isSearchable)
                .map(option => ({ label: option.fieldName, value: option.apiName , type: option.fieldType}));
            // this.fieldsForFilters = this.fieldOptions.map(option => ({ label: option.fieldName, value: option.apiName , type: option.fieldType}));

            // console.log('Picklist Values name:', this.fieldsForFilters[0].fieldName);
            // console.log('Picklist Values api:', this.fieldsForFilters[0].type);
            // console.log('Picklist Values type:', this.fieldsForFilters[0].type);
            // console.log('Picklist Value 0 isSearchable ?? :', this.fieldOptions[0].isSearchable);
/*
*********************************************************
@Method Name    : getTemplateFieldsData
@author         : Kevin Suvagiya
@description    : Method is used to fetch data from the template fields records associated with template (if there are any)
@param          :
    1. templateId {String} : Id of the current  template
@return         : templateDataWrapper :- including the Selected Fields and the custom Separator Separated Filters String
********************************************************
*/
            getTemplateFieldsData({ templateId : this.templateId})
            .then((data) => {
                console.log('The Data fetched is :: ' , data);
                if(data){
                    console.log('Filters ::: ' + data.filters);
                    if(data.filters){
                        this.separatedData = data.filters;
                        this.parseFilterString();
                    }
                    console.log('Fields ::::' + data.fields);
                    if(data.fields){
                        let preSelectedApiNames = data.fields.split(',');
        
                        // Create a map to store seen API names and their original positions
                        const seenApiNames = {};
                        for (let i = 0; i < preSelectedApiNames.length; i++) {
                        seenApiNames[preSelectedApiNames[i].trim()] = i; // Remove potential leading/trailing whitespaces
                        }
        
                        // Filter and sort based on seenApiNames positions
                        this.selectedFields = this.fieldOptions.filter(field =>
                        seenApiNames.hasOwnProperty(field.apiName)
                        ).sort((field1, field2) => seenApiNames[field1.apiName] - seenApiNames[field2.apiName]);
                        this.fieldOptions = this.fieldOptions.filter(field => !preSelectedApiNames.includes(field.apiName));
                    }
                }

                this.showSpinner = false;
            }).catch((err) => {
                this.showSpinner = false;
                console.error('Error fetching template field data values:', {err});
                this.showToast('error', 'Oops! Something went wrong', 'Some error occured while fetching selected Data!', 5000);
            });

            this.showSpinner = false;
        })
        .catch(error => {
            this.showSpinner = false;
            console.error('Error fetching picklist values:', error);
            this.showToast('error', 'Oops! Something went wrong', 'Some error occured while fetching fields!', 5000);
        });

    }

// -=-=- To override the style of the standard Input fields and the comboboxes -=-=-
// -=-=- To Process the existing fields and sorts -=-=-
    renderedCallback(){
        // .slds-form-element__label{
        //     font-size: 13px;
        //     color: #00AEFF;
        //     padding: 0px 5px;
        //     border-radius: 50%;
        //     position: absolute;
        //     z-index: 1;
        //     background-color: white;
        //     top: -10px;
        //     left: 15px;
        // }

        // .slds-form-element_stacked .slds-form-element__label{
        //     padding-left : 5px;
        // }
        // lightning-input-field.slds-form-element.slds-form-element_stacked{
        //     margin: 0;
        //     padding: 0;
        // }
        // .slds-form-element__row{
        //     margin: 0 !important;
        //     gap: 20px !important;
        // }
        // .slds-form-element_compound .slds-form-element{
        //     padding: 0 !important;
        // }
        // .slds-form-element__legend{
        //     display: none !important;
        // }
        // span.slds-form-element__label {
        //     display: none;
        // }
        if(this.initialRender){
            // To OverRider standard slds css properties...
            var mainFilterDiv = this.template.querySelector('.filter-div');
            var styleEle = document.createElement('style');
            styleEle.innerText = `
                        .slds-input, .fix-slds-input_faux{
                            height: 40px;
                            border-radius: 8px;
                            border: 1px solid var(--slds-c-input-color-border);
                        }
                        .slds-input:focus, .slds-combobox__input:focus{
                            border-color: #00aeff;
                            box-shadow: none;
                        }
                        .fix-slds-input_faux{
                            display: flex;
                            align-items: center;
                        }
                        .slds-form-element__label:empty {
                            margin: 0;
                            padding: 0;
                        }
            `;
            if(mainFilterDiv){
                mainFilterDiv.appendChild(styleEle);
                this.initialRender = false;
            }

        }
        if(this.initialFilters){
            if (this.template.querySelector('.filter-div') && this.filtersCount==this.filters.length) { // Check if all filters are rendered
                // console.log('rendered filters' + this.filters.length );
                if(this.filtersCount>0){
                    this.showSpinner = true;
                    for(let i =0; i<this.filters.length; i++) {
                        this.updateOperatorOptions(i);
                    }
                    this.initialFilters = false;
                    this.showSpinner = false;
                }else{
                    this.initialFilters = false;
                }
            }
        }
        if(this.initialSorts){
            if (this.template.querySelector('.sort-div') && this.sortsCount==this.sorts.length) { // Check if all sorts are rendered
                // console.log('rendered sorts' + this.sorts.length );
                if(this.sortsCount>0){
                    this.showSpinner = true;
                    for(let i =0; i<this.sorts.length; i++) {
                        this.updateSelectedSort(i);
                    }
                    this.initialSorts = false;
                    this.showSpinner = false;
                }else{
                    this.initialSorts = false;
                }
            }
        }

    }

// -=-=- To Handle Search functionality from the search key -=-=-
    handleFieldSearch(event){
        this.searchKey = event.target.value.trim();
        console.log('Searched :: ' + this.searchKey);
    }

    get fieldOptionsToShow(){
        this.fieldOptions = this.fieldOptions.slice().sort((a, b) => a.fieldName.localeCompare(b.fieldName));  
        let fieldOptionsUpdated;
        let alreadySelectedRemainingOptions;

        
        if (!this.searchKey) {
            return this.fieldOptions;
        }else{
            fieldOptionsUpdated =  this.fieldOptions.filter(option => option.fieldName.toLowerCase().includes(this.searchKey));
            alreadySelectedRemainingOptions = this.toAddSelected.filter(option =>
                !fieldOptionsUpdated.some(p => p.fieldName == option.fieldName)
            );
            console.log('alreadySelectedRemainingOptions ::: ' , alreadySelectedRemainingOptions);
        }


        // Combine the prioritized fields and the remaining fields
        let updatedFieldOptions = [...fieldOptionsUpdated, ...alreadySelectedRemainingOptions];

        return fieldOptionsUpdated.length ==0 ? this.fieldOptions : updatedFieldOptions ;
    }


// -=-=- To add the Selected fields from the Available section of the Field Selection -=-=-
    handleAvailableClick(event){
        try{
            this.toRemoveSelected = [];
            const currentField = event.currentTarget.dataset.value;
            const currentAPI = event.currentTarget.dataset.api;
            const isCtrlPressed = event.ctrlKey || event.metaKey;
            if (!Array.isArray(this.toAddSelected)) {
                this.toAddSelected = [];
            }
            const index = this.toAddSelected.findIndex(item => item.apiName === currentAPI);
        
            if (isCtrlPressed) {
                if (index !== -1) {
                    this.toAddSelected.splice(index, 1);
                    event.currentTarget.classList.remove("selected-item");
                } else {
                    this.toAddSelected.push({ fieldName: currentField, apiName: currentAPI});
                    event.currentTarget.classList.add("selected-item");
                }
            } else {
            this.toAddSelected = [];
            this.template.querySelectorAll("li").forEach(element => element.classList.remove("selected-item"));
            event.currentTarget.classList.toggle("selected-item"); // Toggle styling
            this.toAddSelected.push({ fieldName: currentField, apiName: currentAPI}); // Add to array
            // console.log('toAddSelected : ', this.toAddSelected[0].apiName);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- To add the selected fields from the Selected section of the Field Selection -=-=-
    handleSelectedClick(event){
        try{
            this.toAddSelected = [];
            const currentField = event.currentTarget.dataset.value;
            const currentAPI = event.currentTarget.dataset.api;
            const isCtrlPressed = event.ctrlKey || event.metaKey;
            if (!Array.isArray(this.toRemoveSelected)) {
            this.toRemoveSelected = [];
            }
            const index = this.toRemoveSelected.findIndex(item => item.apiName === currentAPI);
        
            if (isCtrlPressed) {
            if (index !== -1) {
                this.toRemoveSelected.splice(index, 1);
                event.currentTarget.classList.remove("selected-item");
            } else {
                this.toRemoveSelected.push({ fieldName: currentField, apiName: currentAPI});
                event.currentTarget.classList.add("selected-item");
            }
            } else {
            this.toRemoveSelected = [];
            this.template.querySelectorAll("li").forEach(element => element.classList.remove("selected-item"));
            event.currentTarget.classList.toggle("selected-item"); // Toggle styling
            this.toRemoveSelected.push({ fieldName: currentField, apiName: currentAPI}); // Add to array
            // console.log('toRemoveSelected : ', this.toRemoveSelected[0].apiName);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- To Move selected fields Up by one index -=-=-
    handleUp(){
        try{
            this.reorderList();
            for(let i = 0;i<this.toRemoveSelected.length;i++){
                let index;
                for(let j = 0;j<this.selectedFields.length;j++){
                    if (this.selectedFields[j].apiName == this.toRemoveSelected[i].apiName){
                        index = j;
                        break;
                    }
                }
                if(index<=0){
                    break;
                }
                this.selectedFields = this.swapElements(this.selectedFields,index,index-1);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- To move the selected fields down by one index-=-=-
    handleDown(){
        try{
            this.reorderList();
            for(let i = this.toRemoveSelected.length-1;i>=0;i--){
                let index;
                for(let j = 0;j<this.selectedFields.length;j++){
                    if (this.selectedFields[j].apiName == this.toRemoveSelected[i].apiName){
                        index = j;
                        break;
                    }
                }
                if(index>=this.selectedFields.length-1){
                    break;
                }
                this.selectedFields = this.swapElements(this.selectedFields,index,index+1);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

    handleTop(){
        try{
            this.reorderList();
            for(let i = this.toRemoveSelected.length-1;i>=0;i--){
                let index;
                for(let j = 0;j<this.selectedFields.length;j++){
                    if (this.selectedFields[j].apiName == this.toRemoveSelected[i].apiName){
                        index = j;
                        break;
                    }
                }
                console.log('Index ::' , index);
                this.selectedFields.splice(index, 1);
                this.selectedFields.unshift(this.toRemoveSelected[i]);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

    handleBottom(){
        try {
            this.reorderList();
            for(let i = 0; i < this.toRemoveSelected.length; i++) {
                let index;
                for(let j = 0; j < this.selectedFields.length; j++) {
                    if (this.selectedFields[j].apiName == this.toRemoveSelected[i].apiName) {
                        index = j;
                        break;
                    }
                }
                console.log('Index ::', index);
                this.selectedFields.splice(index, 1); // remove the item and get it
                this.selectedFields.push(this.toRemoveSelected[i]); // add the removed item to the end
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- It works as the Helper function for the handleUp and handleDown Processes -=-=-
    reorderList(){
        try{
            console.log('ToRemoveSelected :: ' , this.toRemoveSelected);
            let reorderedElements = this.selectedFields.map(field => this.toRemoveSelected.find(el => el.apiName === field.apiName));
            this.toRemoveSelected = [];
            for (let i = 0; i < reorderedElements.length; i++) {
                const element = reorderedElements[i];
                if(element){
                    this.toRemoveSelected.push(element);
                }
            }
            console.log('ToRemoveSelected :: ' + this.toRemoveSelected);

        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- It works as the Helper function for the handleUp and handleDown Processes to swap fields as index passed -=-=-
    swapElements(arr, index1, index2) {
        try{
            const updatedArray = [...arr];
            const temp = updatedArray[index1];
            updatedArray[index1] = updatedArray[index2];
            updatedArray[index2] = temp;
        
            return updatedArray;
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

// -=-=- To move the Selected fields form the Selected section to the Available Section and remove from the Selected section -=-=-
    handleLeft(){
        console.log( this.toRemoveSelected.length + ' Getting removed ::: ' + {...this.toRemoveSelected});
        try{
            for(let i=0;i<this.toRemoveSelected.length;i++){
                // console.log('Field Api name :: ' + this.fieldOptions[i].apiName);
                console.log('Selected field :: ' + this.toRemoveSelected[i].apiName);
                this.selectedFields = this.selectedFields.filter((field) => {
                    return field.apiName != this.toRemoveSelected[i].apiName;
                });
                this.fieldOptions.push(this.toRemoveSelected[i]);
            }
            this.toRemoveSelected = [];
        } catch (error) {
            console.error('An error occurred:', {error});
        }
    }

// -=-=- To move the Selected fields form the Available section to the Selected Section and remove from the Available section -=-=-
    handleRight(){
        console.log( this.toAddSelected.length + ' Going to Selected ::: ' + {...this.toAddSelected});
        try{
            for(let i=0;i<this.toAddSelected.length;i++){
                // console.log('Field Api name :: ' + this.fieldOptions[i].apiName);
                console.log('Selected field :: ' + this.toAddSelected[i].apiName);
                this.fieldOptions = this.fieldOptions.filter((field) => {
                    return field.apiName != this.toAddSelected[i].apiName;
                });
                this.selectedFields.push(this.toAddSelected[i]);
            }
            this.toAddSelected = [];
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

    get selectedAvailableFields(){
        return this.toAddSelected.length ? this.toAddSelected.length : this.toRemoveSelected.length;
    }
// -=-=- To add One empty filter object to the filters list -=-=-
    addFilter() {
        this.filters.push({
            fieldName: '',
            operator: '',
            value: '',
            type:'',
            inputType: '',
            operators : []
        });
    }

// -=-=- To add One empty Sort object to the Sorts list -=-=-
    addSort() {
        this.sorts.push({
            field:'',
            order:''
        });
    }
    
// -=-=- To remove clicked filter from the filters list -=-=-
    removeFilter(event){
            const index = event.target.dataset.index;
            console.log('What is index to delete: ' + index);
            if(this.filters.length >1){
                this.filters.splice(index, 1);
            }else if(this.filters.length ==1){
                this.filters[0].fieldName = '';
                this.filters[0].operator = '';
                this.filters[0].value = '';
                this.filters[0].operators = [];
                this.filters[0].type = '';
                this.filters[0].inputType = '';
                this.template.querySelectorAll('.filter-index-div')[0].classList.remove('error-in-row');
            }

            for(let i = 0; i < this.filters.length ; i++){
                this.updateOperatorOptions(i);
            }
    }

// -=-=- To remove clicked sort from the sorts list -=-=-
    removeSort(event){
            const index = event.target.dataset.index;
            // console.log('What is index: ' + index);
            if(this.sorts.length >1){
                this.sorts.splice(index, 1);
            }else if(this.sorts.length ==1){
                this.sorts[0].field = '';
                this.sorts[0].order = '';
                this.template.querySelectorAll('.sort-index-div')[0].classList.remove('error-in-row');
                this.template.querySelectorAll('.asc-btn')[index].classList.remove('selected-sort-order');
                this.template.querySelectorAll('.desc-btn')[index].classList.remove('selected-sort-order');
            }
    }

//-=-=- Specially to show Index from 1, instead of 0 for the Sorts -=-=-
    get adjustedSorts() {
        return this.sorts.map((sort, index) => {
            return {...sort, displayIndex: index + 1};
        });
    }

// -=-=- To validate duplicate sort field and make sort order ASC -=-=- 
    handleSortFieldChange(event){
        const index = event.target.dataset.index;
        let selectedSortFields = [];
        for(let sort of this.sorts){
            selectedSortFields.push(sort.field);
            console.log('Sort Selected Fields :: ' + sort.field);
        }
        console.log( 'Is duplicate ? ', selectedSortFields.includes(event.target.value));
        if(selectedSortFields.includes(event.target.value)){
            this.sorts[index].field = null;
            this.showToast('error', 'Opps! Duplicate detected!', 'You can only sort by a field once..', 5000);
        }else{
            this.sorts[index].field = event.target.value;
            if(this.sorts[index].order == ''){
                const ascBtn = this.template.querySelectorAll('.asc-btn')[index];
                const descBtn = this.template.querySelectorAll('.desc-btn')[index];
                this.sorts[index].order = 'ASC';
                ascBtn.classList.add('selected-sort-order');
                descBtn.classList.remove('selected-sort-order');
            }
            this.template.querySelectorAll('.sort-index-div')[index].classList.remove('error-in-row');
            console.log('Set order to : ' + this.sorts[index].order);
    
            console.log('this Field value :: ' + this.sorts[index].field);
        }
    }

// -=-=- To make clicked sort Ascending -=-=-
    handleAscending(event){
        console.log('Sorting ascending');
        const index = event.target.dataset.index;
        const ascBtn = this.template.querySelectorAll('.asc-btn')[index];
        const descBtn = this.template.querySelectorAll('.desc-btn')[index];
        this.sorts[index].order = 'ASC';
        console.log('Set order to : ' + this.sorts[index].order);
        ascBtn.classList.add('selected-sort-order');
        descBtn.classList.remove('selected-sort-order');

    }

// -=-=- To make clicked sort Descending -=-=-
    handleDescending(event){
        console.log('Sorting descending');
        const index = event.target.dataset.index;
        const ascBtn = this.template.querySelectorAll('.asc-btn')[index];
        const descBtn = this.template.querySelectorAll('.desc-btn')[index];
        this.sorts[index].order = 'DESC';
        console.log('Set order to : ' + this.sorts[index].order);
        descBtn.classList.add('selected-sort-order');
        ascBtn.classList.remove('selected-sort-order');
    }

//-=-=- Specially to show Index from 1, instead of 0 for the Filters -=-=-
    get adjustedFilters() {
        return this.filters.map((filter, index) => {
            return {...filter, displayIndex: index + 1};
        });
    }

// -=-=- Update the Operators based on the Selected Fields -=-=-
    handleFieldNameChange(event) {
        // console.log('This index :: ' + event.target.dataset.index);
        const index = event.target.dataset.index;
        this.filters[index].fieldName = event.target.value;

        console.log('Field Name : ' +   this.filters[index].fieldName );
        console.log('Field type from main ::  ' + this.fieldsForFilters.filter(field => field.value == this.filters[index].fieldName)[0].type);
        this.filters[index].type = this.fieldsForFilters.filter(field => field.value == this.filters[index].fieldName)[0].type;
        this.filters[index].value = '';
        this.validateCurrentFilter(index);
        this.updateOperatorOptions(index);
    }

// -=-=- to validate the Filter on-the-go real-time -=-=-
    validateCurrentFilter(i){
        let filter = this.filters[i];
        const filterIndexDiv = this.template.querySelectorAll('.filter-index-div')[i];
        if(!filter.fieldName || !filter.operator || !filter.value){
            filterIndexDiv.classList.add('error-in-row');
        }else{
            filterIndexDiv.classList.remove('error-in-row');
        }
    }

// -=-=- to handle Operator field selection -=-=-
    handleOperatorChange(event){
        const index = event.target.dataset.index;
        console.log('This value :: ' + event.target.value);
        this.filters[index].operator = event.target.value;
        this.validateCurrentFilter(index);
        console.log('Operator changed to: ' + this.filters[index].operator);
    }

// -=-=- to handle Value change -=-=-
    handleValueChange(event){
        const index = event.target.dataset.index;
        this.filters[index].value= event.target.value.trim();
        
        console.log('Value changed to: ' + this.filters[index].value);
        this.validateCurrentFilter(index);
        // this.generateQuery();
        // this.generateFilterString();
    }

//-=-=- To Update the operators that can be used for a selected field -=-=-
    updateOperatorOptions(index) {
        this.showSpinner = true;
        const fieldType = this.filters[index].type.toLowerCase();
        // this.template.querySelectorAll('.sort-index')[index].innerHTML = index+1;
        // console.log('Field type: ' + fieldType);
        this.filters[index].operators = this.allOperatorOptions.filter(option => option.type.includes(fieldType));

        if(this.filters[index].operators.length<=0 && this.filters[index].fieldName){
            this.filters[index].operators = this.allOperatorOptions.filter(option => option.type.includes('default'));
        }
        const simpleDiv = this.template.querySelectorAll('.simple-input-div')[index];
        const picklistDiv = this.template.querySelectorAll('.picklist-input-div')[index];
        // console.log('the inner HTML of simple Div :: ' + simpleDiv);
        // console.log('the inner HTML of pickloist Div :: ' + picklistDiv);
        simpleDiv.classList.remove('dont-display-div');
        picklistDiv.classList.remove('dont-display-div');
        if(fieldType != 'picklist' && fieldType != 'boolean'){
            picklistDiv.classList.add('dont-display-div');
            if(fieldType == 'phone' || fieldType == 'number' || fieldType == 'currency'){
                this.filters[index].inputType = 'number';
            }else if(fieldType == 'date'){
                this.filters[index].inputType = 'date';
            // }else if(fieldType == 'boolean'){
            //     this.filters[index].inputType = 'toggle';
            //     // console.log('this is a boolean field' + index);
            //     this.template.querySelectorAll('.value-select-for-toggle')[index].checked = (this.filters[index].value=='true' ? true : false);
            }else if(fieldType == 'datetime'){
                this.filters[index].inputType = 'datetime';
            }else if(fieldType == 'email'){
                this.filters[index].inputType = 'email';
            }else if(fieldType == 'url'){
                this.filters[index].inputType = 'url';
            }else{
                this.filters[index].inputType = 'text';
            }
        }else{
            if(fieldType == 'picklist'){

                console.log('this field is :::  ' , this.fieldOptions.filter((option) => option.apiName==this.filters[index].fieldName)[0].picklistValues[0]);
                this.filters[index].inputType = [];
                for(let option of this.fieldOptions.filter((option) => option.apiName==this.filters[index].fieldName)[0].picklistValues){
                    console.log('this Option :: ' , {label:option, value:option});
                    this.filters[index].inputType.push({label:option, value:option});
                }
            }else if(fieldType == 'boolean'){
                this.filters[index].inputType = [
                    {label: 'true', value: 'true'},
                    {label: 'false', value: 'false'}
                ];
            }
            console.log('the Input type is ' , this.filters[index].inputType);
            simpleDiv.classList.add('dont-display-div');
        }

        this.showSpinner = false;
    }

// -=-=- To Update the ASC and DESC for the Existing Sorts -=-=-
    updateSelectedSort(index){
        this.showSpinner = true;
        const ascBtn = this.template.querySelectorAll('.asc-btn')[index];
        const descBtn = this.template.querySelectorAll('.desc-btn')[index];
        if(this.sorts[index].order == 'ASC'){
            ascBtn.classList.add('selected-sort-order');
            descBtn.classList.remove('selected-sort-order');
        }else if(this.sorts[index].order == 'DESC'){
            descBtn.classList.add('selected-sort-order');
            ascBtn.classList.remove('selected-sort-order');
        }
        this.showSpinner = false;
    }
    
// -=-=- To select the logic operator and show or hide the custom logic div if Custom logic is selected -=-=-
    handleLogicUpdate(event){
        this.selectedLogic = event.target.value;
        // console.log('Selected Logic: ' + this.selectedLogic);
        this.selectedLogic == 'Custom' ? this.isCustomLogic = true : this.isCustomLogic = false;
        this.customLogicString = '';
    }

    handleCustomLogicUpdate(event){
        this.customLogicString = event.target.value;
        this.customLogicString = this.customLogicString.toUpperCase();
        this.isCustomLogicValid = this.validateOnEachCharacter();
        if(this.isCustomLogicValid){
            const logicStringInput = this.template.querySelector('.logic-string-input');
            console.log('The Logic Seems to be true!!');
            // console.log('Custom Logic String: ' + this.customLogicString);
            // const validationRegex = /^(\d+|\(|\)|[ANDOR]|\s+)+$/;
            // console.log('IS validated :: ' + validationRegex.test(this.customLogicString));
            this.customLogicString.trim() ? 
            logicStringInput.classList.remove('error-in-input'):
            logicStringInput.classList.add('error-in-input');
        }else{
            console.log('The Logic Seems to be false!!');
        }
    }


    validateOnEachCharacter(){

        if(this.customLogicString){
            console.log('custom logic in validate each :: '  + this.customLogicString);
            const checkCharactersRegex = /^[ANDor\d()\s]*$/i;
            const regex = /\d+/g;
            const logicStringInput = this.template.querySelector('.logic-string-input');
            const errorString =  this.template.querySelector('.error-text');
            // console.log('is true: ' , checkCharactersRegex.test(this.customLogicString));
            if(!checkCharactersRegex.test(this.customLogicString)){
                console.log('The Logic Seems to be false!!');
                logicStringInput.classList.add('error-in-input');
                errorString.innerHTML = 'Oops!, invalid characters found!';
                return false;
            }
            const numbers = this.customLogicString.match(regex);
            console.log('numbers ::' + numbers);
            if(numbers){
                for (const num of numbers) {
                    if (num > this.filters.length || num < 1) {
                        console.log(num , ' Number is greater than ', this.filters.length);
                        logicStringInput.classList.add('error-in-input');
                        errorString.innerHTML ='Um, Filter-'+ num + ' does not exist!';
                        return false;
                    }
                }
            }
            logicStringInput.classList.remove('error-in-input');
            // errorString.innerHTML = 'Great!, everything looks good!';
            errorString.innerHTML = '';
            return true;
        }
        return false;
    }

    validateCustomLogic(){
        console.log('custom logic in blur :: '  + this.customLogicString);
        const logicStringInput = this.template.querySelector('.logic-string-input');
        const errorString =  this.template.querySelector('.error-text');
        logicStringInput.classList.remove('error-in-input');
        if(!this.customLogicString){
            errorString.innerHTML = 'Seems so empty!!';
            console.log('Custom Logic is ::: ' + this.isCustomLogicValid);
            logicStringInput.classList.add('error-in-input');
            this.showErrorMessage('Please Enter a Custom Logic Formula.');
            this.isCustomLogicValid = false;
            return;
        }else{
            const regex = /\d+/g;
            const numbers = this.customLogicString.match(regex);
            console.log('numbers ::' + numbers);
            if(numbers){
                for (const num of numbers) {
                    if (num > this.filters.length  || num <1) {
                        console.log(num , ' Number is greater than ', this.filters.length);
                        this.isCustomLogicValid = false;
                        this.showErrorMessage('Um, Filter-'+ num + ' does not exist!');
                        return;
                    }else if(!this.filters[num-1].fieldName){
                        console.log('Nothing entered in filter ' + num);
                        this.isCustomLogicValid = false;
                        this.showErrorMessage('Um, Filter-'+ num + ' is seems to be empty!!');
                        return;
                    }else{
                        console.log('passed ' + num);
                    }
                }
            }
            let logicString = this.customLogicString.replaceAll('AND', '&').replaceAll('OR', '|').replaceAll(/\d+/g, 'N').split(' ').join('').trim();
            let isValidBrackets = false;
            const validatorAfterConversion =  /^[&|N()]*$/i;
            let count = 0;
            let newString = logicString.split('');
            for (let i = 0; i < logicString.length; i++) {
                let char = logicString[i];
                if (char === '(') {
                    count++;
                    // console.log('the opening Count :: ' + count);
                    newString[i] = count;
                    // console.log('New String :: ' + newString);
                } else if (char === ')') {
                    // console.log('the closing Count :: ' + count);
                    newString[i] = count;
                    if(newString.includes(count)){
                        let startIndex = newString.indexOf(count);
                        // console.log(startIndex);
                        // console.log(newString.slice(startIndex+1,i).join(''));
                        newString[startIndex] = 't';
                        newString[i] = 't';
                        if(startIndex>0 && i< newString.length && (newString[startIndex-1]== '&' || newString[startIndex-1]=='|') && (newString[i+1]== '&' || newString[i+1]=='|') ){
                            if(newString[startIndex-1] == newString[i+1]){
                                console.log('corresponding bracket has good match !!');
                            }else{
                                isValidBrackets = false;
                                break;
                            }
                        }
                    }
                    count--;
                    if (count < 0) {
                        isValidBrackets = false;
                        break;
                    }
                }
            }
            count === 0 ? isValidBrackets=true : isValidBrackets = false;

            console.log('the string generated : ' + logicString);
            console.log('Is Converted String Valid?? ' , validatorAfterConversion.test(logicString));
            if(validatorAfterConversion.test(logicString)){
                if(!isValidBrackets){
                    this.showErrorMessage('There are unmatched brackets in the logic..');
                    this.isCustomLogicValid = false;
                    logicStringInput.classList.add('error-in-input');
                    console.log('Please enter a valid brackets');
                    return;
                }else if(logicString.length == 2){
                    this.isCustomLogicValid = false;
                    this.showErrorMessage('Try these patterns : "1 OR 2"');
                    console.log('Cant be two characters in a logic string!!' + logicString);
                    return;
                }else if(logicString.length == 1 && logicString == 'N'){
                    console.log('Only one number selected' + logicString);
                }else if(logicString.length == 3){
                    console.log('In three !!');
                    if((logicString[0]== '(' && logicString[1]=='N' && logicString[2]==')') || (logicString[0]== 'N' && (logicString[1]=='&' || logicString[1]=='|')  && logicString[2]=='N')){
                        console.log('The  Character is : (N) ');
                    }else{
                        this.isCustomLogicValid = false;
                        this.showErrorMessage('Try this patterns: "(1)" or "1 AND/OR 2".');
                        return;
                    }
                }else if(!((logicString[0] == '(' || logicString[0] == 'N') && (logicString[logicString.length-1] == ')' || logicString[logicString.length-1] == 'N'))){
                    this.isCustomLogicValid = false;
                    logicStringInput.classList.add('error-in-input');
                    this.showErrorMessage('You can Start and end logic only with number or brackets.');
                    console.log('Please enter a valid character');
                    return;
                }else{
                    // console.log('that is what needed!!');
                    console.log('Length of Logic String :: ' + logicString.length);
                    if(logicString.length > 3){
                        for(let i=0; i<logicString.length-1; i++){
                            if(logicString[i] == '('){
                                // console.log('The '+ i +' Character is : (' );
                                if(logicString[i+1] == '('){
                                    // console.log('The '+ +i+1 +' Character is : (');
                                    // if(logicString[i+2] == 'N'){
                                    //     // console.log('The '+ +i+2 +' Character is : N ');
                                    // }else{
                                    //     this.isCustomLogicValid = false;
                                    //     console.log('The '+ +i+2 +' Character Should be : N');
                                    //     break;
                                    // }
                                }else if(logicString[i+1] == 'N'){
                                    // console.log('The '+ +i+1 +' Character is : N ');
                                    if(logicString[i+2] == '&' || logicString[i+2] == '|'){
                                        // console.log('The '+ +i+2 +' Character is : & / | ');
                                    }else{
                                        this.isCustomLogicValid = false;
                                        this.showErrorMessage('There should be operator after the Number.');
                                        // console.log('The '+ +i+2 +' Character Should be :  & / |');
                                        return;
                                    }
                                }else{
                                    // console.log('The '+ +i+1 +' Character Should be : N');
                                    this.isCustomLogicValid = false;
                                    this.showErrorMessage('Please add a number or another "(" after a "(".')
                                    return;
                                }
                                
                            }else if(logicString[i] == 'N'){
                                // console.log('The '+ i +' Character is : N ');
                                if(logicString[i+1] == ')' || logicString[i+1] == '&' || logicString[i+1] == '|'){
    
                                    // console.log('The '+ +i+1 +' Character is : ) / & / | ');
                                }else{
                                    this.isCustomLogicValid = false;
                                    this.showErrorMessage('There should be an Operator or a ")" after a number.');
                                    console.log('The '+ +i+1 +' Character Should be : ) / & / | ');
                                    return;
                                }
                                
                            }else if(logicString[i] == '&'){
                                // console.log('The '+ i +' Character is : & ');
                                if(logicString[i+1] == '('){
                                    // console.log('The '+ +i+1 +' Character is : ( ');
                                }else if(logicString[i+1] == 'N' ){
                                    // console.log('The '+ +i+1 +' Character is : N  ');
                                    if(logicString.length == i+2 || (logicString[i+2] == '&' || logicString[i+2] == ')')){
                                        // console.log('The '+ +i+2 +' Character is : & / )');
                                    }else{
                                        this.isCustomLogicValid = false;
                                        this.showErrorMessage('Try these patterns : "1 AND 2 AND 3" or "1 AND (2 OR 3)".');
                                        console.log('The '+ +i+2 +' Character Should be : &');
                                        return;
                                    }
                                }else{
                                    this.isCustomLogicValid = false;
                                    this.showErrorMessage('There should be an number or a "(" after an operator.');
                                    console.log('The '+ +i+1 +' Character Should be : ) N ');
                                    return;
                                }
                                
                            }else if(logicString[i] == '|'){
                                // console.log('The '+ i +' Character is : | ');
                                if(logicString[i+1] == '('){
                                    // console.log('The '+ +i+1 +' Character is : ( ');
                                }else if(logicString[i+1] == 'N'){
                                    // console.log('The '+ +i+1 +' Character is : N/ ( ');
                                    if(logicString.length == i+2 || logicString[i+2] == '|' || logicString[i+2] == ')'){
                                        // console.log('The '+ +i+2 +' Character is : | / )');
                                    }else{
                                        this.isCustomLogicValid = false;
                                        this.showErrorMessage('Try these patterns : "1 AND 2 AND 3" or "1 OR (2 AND 3)".');
                                        console.log('The '+ +i+2 +' Character Should be : |');
                                        return;
                                    }
                                }else{
                                    this.isCustomLogicValid = false;
                                    this.showErrorMessage('There should be a number or a "(" after an operator.');
                                    console.log('The '+ +i+1 +' Character Should be : N / (');
                                    return;
                                }
                                
                            }else if(logicString[i]== ')'){
                                // console.log('The '+ i +' Character is : ) ');
                                if(logicString[i+1] == ')'){
                                    // console.log('The '+ +i+1 +' Character is : ) / & / |  ');
                                }else if(logicString[i+1] == '&' || logicString[i+1] == '|'){
                                    
                                }else{
                                    this.isCustomLogicValid = false;
                                    this.showErrorMessage('There should be an operator or another ")" after an ")".');
                                    console.log('The '+ +i+1 +' Character Should be : ) / & / | ');
                                    return;
                                }
                                
                            }
                        }
                    }
                }
            }else{
                errorString.innerHTML = 'Ooops! Please check spelling of \'AND\' and \'OR\'';
                this.showErrorMessage('It seems to be spelling mistake of "AND" and "OR".');
                this.isCustomLogicValid = false;
                console.log('That was unexpected!!');
                return;
            }
            console.log('Replaced String :: ' + logicString);
        }
        
        logicStringInput.classList.remove('error-in-input');
        console.log('Custom Logic is ::: ' + this.isCustomLogicValid);
        if(this.isCustomLogicValid){
            // errorString.innerHTML = 'Great!, everything looks good!';
            errorString.innerHTML = '';
            // this.showToast('success', 'Woohoo! A valid Logic!', 'The created logic seems just right to us!', 5000);
        }else{
            logicStringInput.classList.add('error-in-input');
            this.showToast('error', 'Please enter valid Logic!', 'there was an error in the custom logic!', 5000);
        }
        
    }

    showErrorMessage(msg){
        // this.showToast('error', 'Oops! Custom logic is Invalid!', msg, 5000);
        this.isCustomLogicValid = false;
        const logicStringInput = this.template.querySelector('.logic-string-input');
        logicStringInput.classList.remove('error-in-input');
        logicStringInput.classList.add('error-in-input');
        const errorString =  this.template.querySelector('.error-text');
        errorString.innerHTML = msg;
        this.showSpinner = false;
        // const messageContainer = this.template.querySelector('c-message-popup');
        // messageContainer.showMessagePopup({
        //     status: 'error',
        //     title: 'Oops! Custom logic is Invalid!',
        //     message : msg
        // });
    }

    handleLimitUpdate(event){
        this.limit = event.target.value;
        const limitInput = this.template.querySelector('.input-limit');
        // console.log('Limit: ' + parseInt(this.limit));
        (this.limit<1 || this.limit>1000000) ? 
        limitInput.classList.add('error-in-input') :
        limitInput.classList.remove('error-in-input');
    }

    handleLimitToggleChange(event){
        // console.log('Is Checked ::::::::::: ' , event.target.checked);
        this.showLimitInput = event.target.checked;
        this.showLimitInput ? this.limit = 50000 : this.limit = 1000000;
    }
    generateFilterString() {
        // <|MDG|> - for separating the Sort values and Filter Values (Main Separator)
        // <|SDG|> - for separating the sorting field and sorting order
        // <|FDG|> - for separating the filters
        // <|LDG|> - for separating the Logic values if Custom Logic Selected
        // <|IDG|> - for separating the inner filter values
        this.separatedData = '';

        //Save the Sorts
        if (this.sorts.length > 0) {
            this.separatedData +=  this.sorts.map((sort) => {
                if (sort.field && sort.order) {
                    const sortParts = [sort.field, sort.order];
                    return sortParts.join('<|IDG|>'); // Join sort values with separator
                }
            }).join('<|SDG|>'); // Join individual Sorts with separator
        }
        this.separatedData += '<|MDG|>';


        //Save the Filters
        if (this.filters.length > 0) {
            this.separatedData +=  this.filters.map((filter) => {
                if (filter.fieldName && filter.operator && filter.value && filter.type) {
                    const filterParts = [filter.fieldName, filter.operator, filter.value, filter.type, filter.inputType];
                    return filterParts.join('<|IDG|>'); // Join filter values with separator
                }
            }).join('<|FDG|>'); // Join individual filters with separator
        }

        // console.log('String is :: ' + this.separatedData);

        this.separatedData += '<|MDG|>';

        //Save the Logic
        if(this.selectedLogic){
            if (this.isCustomLogic && this.customLogicString.trim()) {
                this.separatedData += this.selectedLogic + '<|LDG|>' + this.customLogicString.trim();
            }else{
                this.separatedData += this.selectedLogic;
            }
        }

        this.separatedData += '<|MDG|>';

        this.separatedData += this.showLimitInput + '<|LDG|>' + this.limit;

        console.log('String is :: ' + this.separatedData);

    }

    parseFilterString(){
        // this.separatedData = 'IsDeleted<|SDG|>asc<|MDG|>MobilePhone<|IDG|>=<|IDG|>91323423423<|IDG|>PHONE<|IDG|>number<|FDG|>LastName<|IDG|>!=<|IDG|>tetewes<|IDG|>STRING<|IDG|>text<|FDG|>';
        if (this.separatedData) {
        
            // console.log('String is :: ' , this.separatedData);
            const parts = this.separatedData.split('<|MDG|>'); // Split at main separator

            const oldSorts = parts[0]
              ?.split('<|SDG|>') // Split individual sorts
              .map((sortPart) => {

                if(sortPart.length >0){
                    // console.log('into the Sort part String ...');
                    const sortValues = sortPart.split('<|IDG|>');
                    return {
                    field: sortValues[0],
                    order: sortValues[1]
                    };
                }
                return null; // Handle invalid filter parts
            })
            .filter((sort) => sort != null); // Remove invalid sorts
            // console.log('Old sorts:', oldSorts[0] ? 'okay' : 'zero');
          
            // Extract filters (if present)
            const oldFilters = parts[1]
              ?.split('<|FDG|>') // Split individual filters
              .map((filterPart) => {

                if(filterPart.length >0){
                    const filterValues = filterPart.split('<|IDG|>');
                    return {
                    fieldName: filterValues[0],
                    operator: filterValues[1],
                    value: filterValues[2],
                    type: filterValues[3],
                    inputType: filterValues[4],
                    operators: []
                    };
                }
                return null; // Handle invalid filter parts
            })
            .filter((filter) => filter !== null); // Remove invalid filters

            if(parts[2]){
                if (parts[2].includes('<|LDG|>')) {
                    this.selectedLogic = parts[2].split('<|LDG|>')[0];
                    this.customLogicString = parts[2].split('<|LDG|>')[1];
                    this.isCustomLogic = true;
                }else{
                    this.selectedLogic = parts[2];
                }
            }
            console.log('THe Custom Logic :::  ' + this.customLogicString);
            
            for(let i =0; i<oldFilters.length; i++) {
                // console.log('type of the filter :: ', oldFilters[i].type);
                const fieldType = oldFilters[i].type.toLowerCase();
                // console.log('Field type: ' + fieldType);
                oldFilters[i].operators = this.allOperatorOptions.filter(option => option.type.includes(fieldType));

                if(oldFilters[i].operators.length<=0 && oldFilters[i].fieldName){
                    oldFilters[i].operators = this.allOperatorOptions.filter(option => option.type.includes('default'));
                }
            }

            if(parts[3]){
                if (parts[3].includes('<|LDG|>')){
                    // console.log('Part 3  :: ' + parts[3]);
                    if(parts[3].split('<|LDG|>')[0] == 'true'){
                        this.showLimitInput = true;
                    }else{
                        this.showLimitInput = false;
                    }
                    this.template.querySelector('.toggle-limit').checked = this.showLimitInput;
                    // console.log('TO show input limit or not :: ' + this.showLimitInput);
                    this.limit = parts[3].split('<|LDG|>')[1];
                }
            }

            this.filters = oldFilters;
            // console.log('sorts length ::: ' + oldSorts.length);
            if(oldSorts.length >0){
                this.sorts = oldSorts;
            }
            
            if(this.sorts.length ==0 ){
                this.addSort();
            }
            
            if(this.filters.length == 0){
                this.addFilter();
            }
            

            this.filtersCount = this.filters.length;
            this.sortsCount = this.sorts.length;
            // console.log('Length of sorts :: ' + this.sortsCount);

        }
        this.showSpinner = false;
    }

    generateQuery(){
        this.generatedQuery = 'SELECT ';
        let selectedApiNames = [];
        this.selectedFields.forEach(field => {
            selectedApiNames.push(field.apiName);
        });
        if(selectedApiNames){
            this.generatedQuery += selectedApiNames.join(', ');
        }else{
            this.generatedQuery += ' Id ';
        }
        this.generatedQuery+= ' FROM '+ this.objectName ;

        const conditions = [];
        this.filters.forEach(filter => {
            // console.log('Field Name : ', filter.fieldName + ' Operator :: ' + filter.operator + ' Operators :: ' + filter.operators + ' Type ::: ' + filter.type + ' Input Type ::: ' + filter.inputType);
            if (filter.fieldName && filter.operator && filter.value && filter.type) {
                // console.log('Field Name : ', filter.fieldName + ' Operator :: ' + filter.operator + ' Operators :: ' + filter.operators + ' Type ::: ' + filter.type + ' Input Type ::: ' + filter.inputType);
                let condition = '';
                // console.log('Filter type :: ' + filter.type);
                if (filter.operator == 'LIKE') {
                    // console.log('Filter is LIKE');
                    condition =  filter.fieldName + ' LIKE \'%' + filter.value + '%\' ';
                }else if (filter.operator == 'startLIKE') {
                    // console.log('Filter is starts LIKE');
                    condition =  filter.fieldName + ' LIKE \'' + filter.value + '%\' ';
                }else if (filter.operator == 'endLIKE') {
                    // console.log('Filter is ends LIKE');
                    condition =  filter.fieldName + ' LIKE \'%' + filter.value + '\' ';
                }else if (filter.operator == 'notLIKE') {
                    // console.log('Filter is not LIKE');
                    condition =  '( NOT ' + filter.fieldName + ' LIKE \'%' + filter.value + '%\' )';
                }else if(filter.type.toUpperCase() == 'NUMBER' || filter.type.toUpperCase() == 'CURRENCY' || filter.type.toUpperCase() == 'DATE' || filter.type.toUpperCase() == 'BOOLEAN' || filter.type.toUpperCase() == 'DATETIME'){
                    // console.log('Filter is non quote');
                    condition = filter.fieldName + ' ' + filter.operator + ' ' + filter.value + ' ';
                }else{
                    // console.log('Filter is quote');
                    condition =  filter.fieldName + ' ' + filter.operator + ' \'' + filter.value + '\' ';
                }
                conditions.push(condition);

            }
        });
        console.log('Conditions length: ' + conditions.length);
        if(this.isCustomLogic===false && conditions.length >0){
            this.generatedQuery += ' WHERE ' + conditions.join(' '+ this.selectedLogic +' ');
        }else if(conditions.length >0){
            try{
                const regex = /\d+/g;
                this.generatedQuery += ' WHERE ' +this.customLogicString.replace(regex, match => {
                    // We are doing -1 because we are showing them from 1 and index starts from 0 for the same filter
                    return ' '+conditions[parseInt(match)-1] + ' ';
                });

            }catch(error){
                console.log('Error in custom Logic ' + error.message);
            }
        
            // Replace numbers with conditions using a regular expression
        }

        let orderBy = [];
        for(let sort of this.sorts){
            if(sort.field && sort.order){
                orderBy.push(sort.field +' '+ sort.order);
            }
        }
        if(orderBy.length >0){
            this.generatedQuery += ' ORDER BY '+  orderBy.join(', ');
        }

        if(this.limit){
            this.generatedQuery += ' LIMIT '+ this.limit;
        }
        console.log('Generated this.generatedQuery : ' + this.generatedQuery);
    }

    async validateData(){
        let invalidData = {
            type: '',
            message: '',
            description: '',
            duration: 5000
        };
        let foundError = false;
        console.log('Generated Query is ::: ' + this.generatedQuery.length);
        // console.log('Validating data limit : ' + this.limit , "is", this.limit <0 || this.limit > 50000);
        if(this.selectedFields.length <=0){
            console.log('Validated selected fields');
            if(!foundError){
                invalidData = {type: 'error', message: 'Oops! You missed to select Fields!', description:'Please Select at least one field!', duration:5000};
                foundError = true;
            }
            // this.showToast('error','Oops! You missed to select Fields!', 'Please Select at least one field!', 5000);
        }

        if(this.sorts){
            const sortIndexDiv = this.template.querySelectorAll('.sort-index-div');
            for (let i = 0; i < this.sorts.length; i++) {
                sortIndexDiv[i].classList.remove('error-in-row');
                let sort = this.sorts[i];
                if((!sort.field || !sort.order) && this.sorts.length !=1){
                    this.showSpinner = false;
                    sortIndexDiv[i].classList.add('error-in-row');
                    if(!foundError){
                        invalidData = {type: 'error', message: 'Oops! You missed to fill data!', description:'Please fill the valid data to sort records..', duration:5000};
                        foundError = true;
                    }
                }
            };
        }

        if(this.isCustomLogic){
            const logicStringInput = this.template.querySelector('.logic-string-input');
            logicStringInput.classList.remove('error-in-input');
            if(!this.customLogicString.trim()){
                console.log('Validated Custom Logic');
                // invalidData = true;
                if(!foundError){
                    invalidData = {type: 'error', message: 'Oops! You missed to select Fields!', description:'Please enter a valid Custom Logic!', duration:5000};
                    foundError = true;
                }
                // this.showToast('error', 'Oops! You missed to fill data!','Please enter a valid Custom Logic!', 5000);
                logicStringInput.classList.add('error-in-input');
                console.log(logicStringInput.classList);
            }
            if(!this.isCustomLogicValid){
                console.log('Custom Logic is ::: ' + this.isCustomLogicValid);
                logicStringInput.classList.add('error-in-input');
                console.log('Validated Custom Logic');
                // invalidData = true;
                if(!foundError){
                    invalidData = {type: 'error', message: 'Oops! Custom logic is invalid!', description:'Please Validate the Custom Logic!!', duration:5000};
                    foundError = true;
                }
            }
        // }else
        }
        if(this.showLimitInput){
            const limitInput = this.template.querySelector('.input-limit');
            limitInput.classList.remove('error-in-input');
            if(this.limit <1 || this.limit > 1000000){
                    console.log('validated Limit');
                    // invalidData = true;
                    if(!foundError){
                        invalidData = {type: 'error', message: 'Oops! You entered wrong limit!', description:'Please enter a limit between 0 and 1000000!', duration:5000};
                        foundError = true;
                    }
                    // this.showToast('error', 'Oops! You entered wrong limit!', 'Please enter a limit between 0 and 50000!', 5000);
        
                    limitInput.classList.add('error-in-input');
                    console.log(limitInput.classList);
            }
        }
        if(this.filters){
            const filterIndexDiv = this.template.querySelectorAll('.filter-index-div');
            for (let i = 0; i < this.filters.length; i++) {
                filterIndexDiv[i].classList.remove('error-in-row');
                let filter = this.filters[i];
                if((!filter.fieldName || !filter.operator || !filter.value.trim()) && this.filters.length != 1){
                    this.showSpinner = false;
                    filterIndexDiv[i].classList.add('error-in-row');
                    if(!foundError){
                        invalidData = {type: 'error', message: 'Oops! You missed to fill data!', description:'Please fill the valid data to filter records..', duration:5000};
                        foundError = true;
                    }
                }else if(filter.fieldName && filter.operator && (filter.type.toUpperCase() == 'REFERENCE' || filter.type.toUpperCase() == 'ID')){
                    const objPrefix =  await validateRelatedObject({ objName: this.objectName , apiName: filter.fieldName.toUpperCase() });
                    console.log('obj Prefix :: ' + objPrefix);
                    if(objPrefix && filter.value.slice(0,3) == objPrefix && (filter.value.length == 15 || filter.value.length ==18)){
                        console.log('Relational field '+ filter.fieldName + ' Is Valid!!');
                    }else{
                        console.log('Relational field '+ filter.fieldName + ' Is Invalid!!');
                        filterIndexDiv[i].classList.add('error-in-row');
                        if(!foundError){
                            invalidData = {type: 'error', message: 'Oops! You Filled Incorrect data!', description:'Please correct the id in the record ID fields..', duration:5000};
                            foundError = true;
                        }
                    }
                }
            };
        }
        if(this.generatedQuery.length > 1000000){
            if(!foundError){
                invalidData = {type: 'error', message: 'Oops! It\'s Our fault!', description:'Try removing some of the filters..', duration:5000};
                foundError = true;
            }
            // this.showToast('error', 'Oops! It\'s Our fault!', ' Please remove some of the filters!', 5000);
            // invalidData = true;
            console.log('The Query is too long, size ::: ' + this.generatedQuery.length);
        }

        if(!foundError){
            // this.showSpinner = false;
/*
*********************************************************
@Method Name    : testQueryMethod
@author         : Kevin Suvagiya
@description    : Method is used to test the query generated, using executing the query once
@param          :
    1. query       {String} : Generated query string based on the Selections
@return         : (Nothing will be returned)
********************************************************
*/
            // testQueryMethod({ query : this.generatedQuery})
            // .then(() => {
            //     console.log('Validation Completed..');
            //     console.log('No error found in data!');
            //     console.log('Saving the template Fields...');
            //     try {
                    let selectedApiNames = [];
                    this.selectedFields.forEach(field => {
                        selectedApiNames.push(field.apiName);
                    });
                    let fields = selectedApiNames.join(',');
/*
*********************************************************
@Method Name    : saveTemplateFields
@author         : Kevin Suvagiya
@description    : Method is used to save all the Selected fields and the filters on the template fields associated with the selected template
@param          :
    1. allFields   {String} : name of the object
    2. templateId  {String} : Id of the current template
    3. query       {String} : Generated query string based on the Selections
    4. filters     {String} : Generated Custom separator separated String, to store all sorts, filters, logic and Limit
@return         : (Nothing will be returned)
********************************************************
*/
                    saveTemplateFields({allFields: fields , templateId : this.templateId, query: this.generatedQuery, filters : this.separatedData})
                    .then(()=>{
                        console.log('Template Fields saved successfully');
                        this.showToast('success', 'Yay! Everything worked!', 'The template fields were saved successfully', 5000);
                    })
                    .catch(error=> {
                        const eMessage = this.selectedFields ? 'Something went wrong, Please try again!!' : 'Please Select at least one field!';
                        this.showToast('error', 'Oops! Something went wrong', eMessage, 5000);
                    });
                // } catch (error) {
                //     console.log('Error saving the template Fields :' + error.message);
                //     this.showToast('error', 'Oops! Something went wrong!', 'There was error saving your template fields.', 5000)
                // }
            // })
            // .catch(error => {
            //     // Handle any errors
            //     this.errorMessage = 'An error occurred while validating the query.';
            //     console.error('Error validating query:', error);
            //     this.showToast('error', 'Oops!, Something went Wrong!', 'Please enter valid Filter Criteria..', 5000);
            // });
        // }else{
            // this.showToast('error', 'Oops! Something went Wrong!', 'Please enter fill out the valid data!!', 5000);
        }else{
            console.log('Invalid data found!' , foundError);
            console.log('this invalidan data : ', invalidData.type, invalidData.message, invalidData.description, invalidData.duration);
            this.showToast(invalidData.type, invalidData.message, invalidData.description, invalidData.duration);
            this.showSpinner = false;
        }
    }

    handleSave(){
        this.showSpinner = true;
        console.log('In Save!');
        this.generateFilterString();
        console.log('Generated the Filter String!!');
        this.generateQuery();
        console.log('Generated the Query String!!');
        if(this.isCustomLogic){
            this.validateCustomLogic();
        }
        console.log('Custom Logic is Validated!!');
        this.validateData();
    }
    

    handleCancel(){
        try {
            // const closeModalEvent = new CustomEvent('closemodal');
            // this.dispatchEvent(closeModalEvent);
            this.showSpinner = false;
            const messageContainer = this.template.querySelector('c-message-popup')
            messageContainer.showMessagePopup({
                status: 'warning',
                title: 'Are you sure, you want to close?',
                message : 'Your changes may not be saved.'
            });
            // this.navigateToComp(this.components.home);
        } catch (error) {
            console.log('Error handleCancel :' + error.message);
        }
    }

    handleConfirmation(event){
        console.log('handleConfirmation :: ' + event.detail);
        if(event.detail){
            this.navigateToComp(this.components.home);
        }
    }

    handleReset(){
        this.sorts = [];
        this.addSort();
        this.template.querySelector('.sort-index-div').classList.remove('error-in-row');
        this.filters = [];
        this.addFilter();
        this.template.querySelector('.filter-index-div').classList.remove('error-in-row');
        this.customLogicString = '';
        this.isCustomLogic = false;
        this.selectedLogic = 'AND';
        this.showLimitInput = false;
        this.template.querySelector('.toggle-limit').checked = this.showLimitInput;
        this.template.querySelectorAll('.asc-btn')[0].classList.remove('selected-sort-order');
        this.template.querySelectorAll('.desc-btn')[0].classList.remove('selected-sort-order');
        this.limit = 1000000;

    }


    showToast(status, title, message, duration){
        this.showSpinner = false;
        const messageContainer = this.template.querySelector('c-message-popup')
        messageContainer.showMessageToast({
            status: status,
            title: title,
            message : message,
            duration : duration
        });
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