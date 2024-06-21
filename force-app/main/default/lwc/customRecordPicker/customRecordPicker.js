import { LightningElement, api, track, wire } from "lwc";
import { gql, graphql } from "lightning/uiGraphQLApi";

export default class CustomRecordPicker extends LightningElement {

    // ***************************************************************************** //
    // *                             API Attributes           
    // * label              (attribute - label)
    // * multiselect        (attribute - multiselect)                          
    // * searchable         (attribute - searchable)                         
    // * required           (attribute - required)
    // * disabled           (attribute - disabled)                      
    // * showClearButton    (attribute - show-clear-button)                                                     
    // * iconName           (attribute - icon-name)                       
    // * value              (attribute - value)      
    // * dropdownPosition   (attribute - dropdown-position)      
    // * placeholder        (attribute - placeholder) 
    // * hideSearchIcon     (attribute - hide-search-icon)

    // * ====== API Attributes to make "dynamic records fetch" combobox ====
    // *
    // * queryObjectApi         (attribute - query-object-api)      [... Required Attribute ...]     
    // * labelFieldApi          (attribute - label-field-api)
    // * descriptionFieldApi    (attribute - description-field-api)
    // * helptextFieldApi       (attribute - helptext-field-api)
    // * searchByFields         (attribute - search-by-fields)
    // *

    // * =========== dispatch events ============ 
    // *
    // * change (onchange)      -- Trigger when user select or remove selected option
    // * focus (onfocus)        -- Trigger when user focus in input for searchable combo
    // * blur (onblur)          -- Trigger when user blur from input for searchable combo
    // * search (onsearch)      -- Trigger when user search value in input for searchable combo
    // * error (onerror)        -- Trigger when graphQL trow any error
    // * ready (onready)        -- Trigger when first time data load successfully
    // *

    // ******** API Functions / Method -- Used from parent component...
    // * unselectOption     (method)                             
    // * clearValue         (method)                        
    // * resetValue         (method)                         
    // * isInvalidInput     (method)
    // *
    // ***************************************************************************** //

    
    _label;
    @api get label(){ return this._label }
    set label(value){ this._label = value }

    // define comboBox is multi-select or not...
    isMultiSelect;      
    @api get multiselect(){ return this.isMultiSelect };
    set multiselect(value){ this.isMultiSelect = (value == 'true' || value == true) ? true : false };

    // define comboBox is searchable or not... BY DEFAULT it is searchable...
    isSearchable = true;                 
    @api get searchable(){ return this.isSearchable};
    set searchable(value){ this.isSearchable = (value == 'false' || value == false) ? false : true };

    // define comboBox is required or not...
    isRequired;                 
    @api get required(){ return this.isRequired };
    set required(value){ this.isRequired = (value == 'true' || value == true) ? true : false};

    _disabled;
    @api get disabled(){ return this._disabled };
    set disabled(value){ this._disabled = (value == 'true' || value == true) ? true : false };

    // use to displays cross icon once option in selected...
    _showClearButton = true;
    @api get showClearButton(){ return this._showClearButton};
    set showClearButton(value){ this._showClearButton = (value == 'false' || value == false) ? false : true};

    // to Show Hide Option Description...
    get showDescription(){ return this.descriptionFieldApi ? true : false };

    get showHelpText(){ return this.helptextFieldApi ? true : false };
    
    get showOptionIcon(){ return this.iconName ? true : false}
    
    _iconName;
    @api get iconName(){ return this._iconName};
    set iconName(value){ this._iconName = value ? value : this._iconName};

    // use to hide search icon... and show native down arrow...Only for Searchable Combobox
    _hideSearchIcon;
    @api get hideSearchIcon(){ return this._hideSearchIcon};
    set hideSearchIcon(value){ this._hideSearchIcon = (value == 'true' || value == true) ? true : false};

    @track options;

    valueToSet;
    @api get value(){ return this.valueToSet };
    set value(val){
        try {
            this.valueToSet = val;
            if(val && this.options && this.options.length){
                this.setDefaultValue();
            }
            else{
                this.clearValue();
            }
        } catch (error) {
            console.log(error.stack);
        }
    }

    @track setDropDownPosition = '';
    @api get dropdownPosition(){ return this.setDropDownPosition };
    set dropdownPosition(value){
        if(value == 'left'){
            this.setDropDownPosition = this.setDropDownPosition + `
                    right: 0% !important;
                    left: auto !important;
                    transform: translateX(0px);
            `
        }
        else if(value == 'right'){
            this.setDropDownPosition =  this.setDropDownPosition + `
                    left: 0% !important;
                    transform: translateX(0px);
            `
        }
        else{
            // by default drop down set to center
            this.setDropDownPosition = ''
        }
    }

    @api get dropdownTop(){return this.setDropDownPosition };
    set dropdownTop(value){
        if((value == 'true' || value == true)){
            this.setDropDownPosition = this.setDropDownPosition + `
                top: auto !important;
                bottom: 100% !important;
            `
        }
    }

    _placeholder;
    @api get placeholder(){ return this._placeholder };
    set placeholder(value){ 
        this._placeholder = value;
        this.setPlaceHolder();
     }

     // === === object api from where we fetch records === ===
     _queryObjectAPI;
     @api get queryObjectApi(){ return this._queryObjectAPI };
     set queryObjectApi(value){ this._queryObjectAPI = value};

     // === === field api from where we display records label === ===
     _labelField = 'Name';
     @api get labelFieldApi(){ return this._labelField };
     set labelFieldApi(value){ this._labelField = value ? value : this._labelField};

     // === === field api from where we display records description === ===
     _descriptionField;
     @api get descriptionFieldApi(){ return this._descriptionField };
     set descriptionFieldApi(value){ this._descriptionField = value };

    // === === field api from where we display records helptext === ===
    _helptextField;
    @api get helptextFieldApi(){ return this._helptextField };
    set helptextFieldApi(value){ this._helptextField = value };

    // === === searchByFields from where we search records === ===
    _searchFields = [];
    @api get searchByFields(){ return this._searchFields };
    set searchByFields(value){
        if(typeof value == 'object'){
            // if searchByFields are defied in array....
            this._searchFields = value.forEach(ele => ele.trim());      // Trim to remove white space...
        }
        else if(typeof value == 'string'){
            if(value.includes(',')){
                // if searchByFields are defied by comma separated string....
                this._searchFields = value.split(',').forEach(ele => ele.trim());
            }
            else{
                // if searchByFields is single field....
                this._searchFields = [value.trim()];
            }
        }
    }
    
    @track placeholderText = ''             // to set placeholder in markup as per multi select options
    
    @track displayOptions = [];              // to display option in dropdown
    @track selectedOptions = [];              // to set store and send selected option to parent component
    @track selectedOptionLabel = null;      // to display selected option in markup (for single select)

    @track searchedValue = '';              // to dynamic record fetch based on search key...
    @track fetchingRecords = true;          // to identify record are fetched or still in process;
    @track isGqlError = false;

    get _selectedOptionLabel(){
        return this.selectedOptionLabel;
    }
    
    get loadStyle(){
        // if combo in searchable, then dropdown button section placed above the back-shadow....
        if(this.searchable){
            return `position: relative;z-index: 11;`;
        }
        // if combo in not searchable, then dropdown button section placed below the back-shadow....
        else{
            return `position: relative;`;
        }
    }

    // to display no result found when search result not found...
    get isOptions(){
        return this.displayOptions.length ? true : false;
    }

    get emptyOptionLabel(){
        if(this.queryObjectApi){
            return  this.fetchingRecords ? 'fetching records...' : 'couldn\'t find any records';
        }
        else{
            return 'Query Object not defined';
        }  
    }

    get gqlErrorMessage(){
        return 'Records cannot be fetched because of configuration problem.'
    }

    // * ======== ======= ========== =======  graphQL Logic to get record without apex ========= ============ ========== =========== 
    get gqlQueryString(){
        if(this.queryObjectApi){

            // Prepare gql Query String to fetch field value for description...
            var descriptionFieldQuery = '';
            if(this.descriptionFieldApi?.includes('.')){
                // IF descriptionFieldApi belongs to parent object field....
                descriptionFieldQuery = `${this.descriptionFieldApi.split('.')[0]}{ ${this.descriptionFieldApi.split('.')[1]} {value} }`;
            }
            else{
                descriptionFieldQuery = this.descriptionFieldApi ? `${this.descriptionFieldApi} {value}` : '';
            }

            // Prepare gql Query String to fetch field value for helptext
            var helptextFieldQuery = '';
            if(this.helptextFieldApi?.includes('.')){
                // IF helptextFieldApi belongs to parent object field....
                helptextFieldQuery = `${this.helptextFieldApi.split('.')[0]}{ ${this.helptextFieldApi.split('.')[1]} {value} }`;
            }
            else{
                helptextFieldQuery = this.helptextFieldApi ? `${this.helptextFieldApi} {value}` : '';
            }
            
            // add label field into search fields if not included....
            !this.searchByFields?.includes(this.labelFieldApi) && this.searchByFields.push(this.labelFieldApi); 

            // Prepare gql Query String for searching....
            var searchingString = ''
            this.searchByFields.forEach(ele => {
                searchingString += ele.includes('.') ? 
                                        `{ ${ele.split('.')[0]} : { ${ele.split('.')[1]} : { like : $searchedValue }} }
                                        ` :
                                        `{ ${ele} : { like : $searchedValue } }
                                        `;
            })

            var searchQuery = `where : {
                                        or : [
                                            ${searchingString}
                                        ]
                                    }`

            return `
            query AccountWithName${this.searchedValue ? '($searchedValue : String!)' : ''}{
                uiapi {
                query { 
                    ${this.queryObjectApi}(
                        ${this.searchedValue ? 
                        `${searchQuery}` : ''}
                        first: 250) {
                    edges {
                        node {
                        Id
                        ${this.labelFieldApi}{ value }
                        ${descriptionFieldQuery}
                        ${helptextFieldQuery}
                            }
                        }
                    }
                    }
                }
            }`;
        }
        else{
            console.warn('custom combobox warning : query object api is not defined');
            return undefined;
        }
    }

    get gqlQuery(){
        console.log('gqlQueryString : ', this.gqlQueryString);
        return  this.queryObjectApi ? gql`${this.gqlQueryString}` : undefined;
    }

    get gqlVariables(){
        return {
            searchedValue :  `%${this.searchedValue}%`,
        };
    }

    // if queryObjectApi is defined, then and then wire method return proper response...
    @wire(graphql, {
        query: '$gqlQuery',
        variables: '$gqlVariables',
    })
    graphqlQueryResult({ data, errors }) {
        if (data && this.queryObjectApi){
            // When data is available, dynamicRecords = true AND queryObjectApi is defined...
            // THEN set displayOption from fetched records
            this.options = data.uiapi.query[this.queryObjectApi].edges.map((edge) => edge.node);
            this.setDisplayOptions();
            this.setSelection();
            this.fetchingRecords && (new CustomEvent('ready'))      // once first time data loaded ... fire custom event
            this.fetchingRecords = false;
            this.isGqlError = false;
        }
        if(errors){
            console.warn('custom combobox graphQL Error : ', errors);
            this.dispatchEvent(new CustomEvent('error', {detail : errors}));
            this.disabled = true;
            this.isGqlError = true;
            this.setErrorBorder();
            this.fetchingRecords = false;
        }    
    }

    setDisplayOptions(){
        try {
            if(this.options){
                var tempOptions = JSON.parse(JSON.stringify(this.options));
                tempOptions.forEach(ele => {
                    const description = this.descriptionFieldApi?.includes('.') ? ele[this.descriptionFieldApi.split('.')[0]][this.descriptionFieldApi.split('.')[1]] : ele[this.descriptionFieldApi];

                    const helpText = this.helptextFieldApi?.includes('.') ? ele[this.helptextFieldApi.split('.')[0]][this.helptextFieldApi.split('.')[1]] : ele[this.helptextFieldApi];

                    ele['label'] = ele[this.labelFieldApi]?.value,
                    ele['value'] = ele.Id,
                    (this.descriptionFieldApi) && (ele['description'] = description?.value),   // if Description field defined... add description key with field value...
                    (this.helptextFieldApi) && (ele['helptext'] = helpText?.value),            // if Helptext field defined... add helptext key with field value...
                    ele['isSelected'] = false;                                  // by default set all option as unselected
                    ele['originalIndex'] = tempOptions.indexOf(ele);            // set original index of option for re-sorting
                });
    
                this.displayOptions = tempOptions;
    
                // if(this.value){
                //     this.setDefaultValue();
                // }
                // else{
                //     this.clearValue();
                // }
            }

        } catch (error) {
            console.warn('error inside  in setDisplayOptions  in custom combobox : ', error.stack);
        }
    }
    
    // Set default value if user passes value...
    setDefaultValue(){
        try {
            const valueToSet = typeof this.value == 'object' ? this.value : [this.value];

            if(this.multiselect){
                valueToSet.forEach(ele => {
                    var matchedOption = this.displayOptions.find(option => option.value == ele);

                    if(matchedOption && !matchedOption.disabled){
                        (!matchedOption.isSelected) && this.selectedOptions.push(matchedOption);
                    }
                    else{
                        this.selectedOptions = this.selectedOptions.filter((ele) => {
                            return ele != ele;
                        });
                    }
                });

                this.setPlaceHolder();
            }
            else{

                // for single select took first one as default option...
                var matchedOption = this.displayOptions.find(option => option.value == valueToSet[0]);
                if(matchedOption && !matchedOption.disabled){
                    this.selectedOptions = [matchedOption];
                    this.selectedOptionLabel = matchedOption.label;
                }
                else{
                    this.selectedOptions = [];
                    this.selectedOptionLabel = null;
                }
            }
            this.setSelection();
            
        } catch (error) {
            console.warn('error in setDefaultValue custom combobox : ', error.stack);
        }
    }

    handleShowDropDown(event){
        try {
            const comboBoxDiv = this.template.querySelector(`[data-id="slds-combobox"]`);
            if(comboBoxDiv){
                comboBoxDiv.classList.add('slds-is-open');
            }

            const backDrop = this.template.querySelector('.backDrop');
            if(backDrop){
                backDrop.style = 'display : block'
            }

            this.sortDisplayItems();

			if(event.type == 'focus'){
				this.dispatchEvent(new CustomEvent('focus'));
			}

        } catch (error) {
            console.warn('error inside handleShowDropDown in custom combobox : ', error.stack);
        }
    }

	handleInputBlur(){
		this.dispatchEvent(new CustomEvent('blur'));
	}

    handleSearch(event){
        (!this.isGqlError) && (this.searchedValue = event.target.value);
    }

    // this method use to send value to parent component on option selection....
    handleOptionClick(event){
        try {
            // Use Original Index as unique Value and comparison...
            var itemValue = event.currentTarget.dataset.value;
            var itemIndex = event.currentTarget.dataset.index
            const selectedRecord = this.displayOptions[itemIndex];
            if(selectedRecord && !selectedRecord.disabled){
                if(this.multiselect){
    
                    // Assign or remove clicked option from selected list...
                    if(!selectedRecord.isSelected){
                        this.displayOptions[itemIndex].isSelected = true;
                        this.selectedOptions.push(selectedRecord);
                    }
                    else{
                        this.displayOptions[itemIndex].isSelected = false;
                        this.selectedOptions = this.selectedOptions.filter((ele) => {
                            return ele.value != itemValue;
                        });
                    }
                    this.setPlaceHolder();
    
                    // this logic create a list of selected options with original values...(remove additional keys...)
                    var selectedRecordList = [] ;
                    this.selectedOptions.forEach((ele) => {
                        selectedRecordList.push(this.options.find(item => item.Id == ele.value));
                    });
    
                    // Send data to parent component...
                    this.dispatchEvent(new CustomEvent('change',{
                        detail : selectedRecordList
                    }));
    
                }
                else{
                    
                    this.selectedOptionLabel = event.currentTarget.dataset.label;
                    
                    this.selectedOptions = [selectedRecord];
                    this.setSelection();
    
                    // if combobox is not multi-select it will return array with only one element...
                    this.dispatchEvent(new CustomEvent('change',{detail : 
                        [this.options.find(ele => ele.Id == itemValue)]
                    }));
               
                    this.closeDropDown();
                }
    
                this.setErrorBorder();
            }
            
        } catch (error) {
            console.warn('error inside handleOptionClick in custom combobox : ', error.stack);
        }
    }

    //this method only for Single select Combo-Box
    clearSelection(event){ 
        try {
            this.selectedOptionLabel = null;
            this.selectedOptions = [];

            this.displayOptions.forEach(option => {option.isSelected = false;});

            // Send Null Data to parent Component...
            this.dispatchEvent(new CustomEvent('change',{detail : 
                []
            }));

            this.searchedValue = null;

            if(this.searchable){
                const searchInput = this.template.querySelector('[data-id="search-input"]');
                searchInput && searchInput.focus();
            }

            this.clearSearch();
            this.setErrorBorder();
            this.setPlaceHolder();
        } catch (error) {
            console.warn('error in clearSelection custom combobox : ', error.stack);
        }
    }

    closeDropDown(event){
        try {
            // remove slds-is-open class from combobox div to hide dropdown...
            const comboBoxDiv = this.template.querySelector(`[data-id="slds-combobox"]`);
            if(comboBoxDiv && comboBoxDiv.classList.contains('slds-is-open')){
                comboBoxDiv.classList.remove('slds-is-open');
            }

            // remove back-shodow from main div
            const backDrop = this.template.querySelector('.backDrop');
            if(backDrop){
                backDrop.style = 'display : none'
            }

            this.setErrorBorder();
            this.sortDisplayItems();

        } catch (error) {
            console.warn('error inside closeDropDown in custom combobox : ', error.stack);
        }
    }

    // Generic Method -> to update initial options list and display option list...as option select and unselect...
    setSelection(){
        try {
            this.displayOptions.forEach(item => { 
                item.isSelected = this.selectedOptions.length ? this.selectedOptions.some(ele => ele.value == item.value) : false
            });
        } catch (error) {
            console.warn('error in setSelection : ', error.stack);
        }
    }

    // Generic Method -> to Set place older as user select or unselect options... (Generally used for multi-Select combobox)
    setPlaceHolder(){
        if(this.selectedOptions.length < 1){
            this.placeholderText = this.placeholder ? this.placeholder : (this.multiselect ? 'Select an Options...' : 'Select an Option...');
        }
        else{
            var length = this.selectedOptions.length;
            this.placeholderText = this.selectedOptions.length + (length == 1 ? ' option' : ' options') + ' selected';
        }
    }

    //Generic Method -> to Set error border if combobox is required == true and no option selected...
    setErrorBorder(){
        try {
            if(this.required || this.isGqlError){
                if((this.multiselect && this.selectedOptions.length == 0) || (!this.multiselect && this.selectedOptionLabel == null)){
                    this.template.querySelector('.slds-combobox__input')
                    .style = `  background-color: rgb(255, 255, 255);
                                border-color: rgb(238 72 65);
                                box-shadow: rgb(243 82 76) 0px 0px 1px 1px;
                    `;
                }
                else {
                    this.template.querySelector('.slds-combobox__input').style = '';
                }
            }
        } catch (error) {
            console.warn('error in setErrorBorder in custom combobox  : ', error.stack);
        }
    }

    // Generic Method -> to  sort the display options based on selected or unselect...
    sortDisplayItems(){
        try {
            var displayOptions = JSON.parse(JSON.stringify(this.displayOptions));
            // Sort the display options based on selected or unselect...
            displayOptions.sort((a,b) => {
                if(a.isSelected > b.isSelected){
                    return -1;
                }
                if(a.isSelected < b.isSelected){
                    return 1;
                }
                if(a.isSelected == b.isSelected){
                     if(a.originalIndex < b.originalIndex){
                        return -1;
                     }
                     if(a.label > b.label){
                        return 1;
                     }
                }
            });

            this.displayOptions = displayOptions;
            
        } catch (error) {
            console.warn('error in sortDisplayItems in custom combobox : ', error.stack);
        }
    }

    handleDisableClick(event){
        event.stopPropagation();
        event.preventDefault();
    }

// === ==== ==== ===  [ API Methods to Access from Parent Components ] === === == === ==== ===

    // When user remove selected option form parent component... use this method to remove it from selecteOption Array.....
    @api
    unselectOption(unselectedOption){
        try {
            this.selectedOptions = this.selectedOptions.filter((option) => {
                option.isSelected = false;
                return option.value != unselectedOption;
            });

            this.setSelection();
            this.setErrorBorder();
            this.setPlaceHolder();
        } catch (error) {
            console.warn('error in unselectOption in custom combobox : ', error.stack);
        }
    }

    // Clear all value from parent component....
    @api
    clearValue(){
        try {
            if(this.multiselect){
                if(this.selectedOptions.length > 0){
                    this.selectedOptions = this.selectedOptions.filter((option) => {
                        option.isSelected = false;
                        return null;
                    });

                    this.setSelection();
                    this.setErrorBorder();
                    this.setPlaceHolder();
                }
            }
            else{
                if(this.selectedOptionLabel != null){
                    this.clearSelection();
                }
            }
        } catch (error) {
            console.warn('error in clearAll in custom combobox : ', error.stack);
        }
    }

    // Reset value to default value from parent component....
    @api
    resetValue(){
        this.clearValue();
        if(this.value){
            // this.setDefaultSection();
            this.setDefaultValue();
        }
    }

    // ==== Clear search value of input element for searchable combobox...
    @api 
    clearSearch(){
        try {
            if(this.searchable){
                const searchInput = this.template.querySelector('[data-id="search-input"]');
                searchInput && (searchInput.value = '');
            }
        } catch (error) {
            console.warn('error in clearSearch : custom combobox : ', error.stack);
        }
    }

    // Set Error Border from Parent component as per validation on parent component...
    @api
    isInvalidInput(isInvalid){
        try {
            // if isInvalid is "TRUE" --> Show Error Border...
            if(isInvalid){
                this.template.querySelector('.slds-combobox__input')
                .style = `  background-color: rgb(255, 255, 255);
                            border-color: rgb(238 72 65);
                            box-shadow: rgb(243 82 76) 0px 0px 1px 1px;
                `;
            }
            // else Remove Error Border...
            else{
                this.template.querySelector('.slds-combobox__input').style = '';
            }
        } catch (error) {
            console.warn('error in isInvalidInput : custom combobox :', error.stack);
            
        }
    }

}