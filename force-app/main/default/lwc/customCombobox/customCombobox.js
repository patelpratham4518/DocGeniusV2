import { LightningElement, api, track, wire } from "lwc";
import { CloseActionScreenEvent } from 'lightning/actions';

export default class CustomCombobox extends LightningElement {

    // ***************************************************************************** //
    // *                             APIs           
    // * label              (attribute - label)
    // * multiselect        (attribute - multiselect)                          
    // * searchable         (attribute - searchable)                         
    // * required           (attribute - required)                      
    // * showClearButton    (attribute - show-clear-button)                            
    // * showDescription    (attribute - show-description)                              
    // * showIcon           (attribute - show-icon)                       
    // * showName           (attribute - show-name)                       
    // * showHelpText       (attribute - show-helptext)      
    // * value              (attribute - value)      
    // * dropdownPosition   (attribute - dropdown-position)      
    // * placeholder        (attribute - placeholder) 

    // * options            (attribute - options)    [ ...Required Attribute... ]  
    // * keys of options :
    // *     label : 'option label'               (Required), 
    // *     value : 'option unique value'        (Required), 
    // *     description : 'option description'   (optional), 
    // *     helptext : 'option helptext'         (optional),
    // *     disable : true/false                 (optional),
    
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
    set multiselect(value){ this.isMultiSelect = value == 'true' ? true : false };

    // define comboBox is searchable or not...
    isSearchable;                 
    @api get searchable(){ return this.isSearchable};
    set searchable(value){ this.isSearchable = value == 'true' ? true : false };

    // define comboBox is required or not...
    isRequired;                 
    @api get required(){ return this.isRequired };
    set required(value){ this.isRequired = value == 'true' ? true : false};

    // use to displays cross icon once option in selected...
    _showClearButton = true;
    @api get showClearButton(){ return this._showClearButton};
    set showClearButton(value){ this._showClearButton = value == 'false' ? false : true};

    // API to Show Hide Option Description...
    isDescription;
    @api get showDescription(){ return this.isDescription };
    set showDescription(value){ this.isDescription = value == 'true' ? true : false };

    @api iconName = "standard:account";
    _showIcon;
    @api get showIcon(){ return this._showIcon}
    set showIcon(value){ this._showIcon = value == 'true' ? true : false}

    _showHelpText;
    @api get showHelpText(){ return this._showHelpText };
    set showHelpText(value){ this._showHelpText = value == 'true' ? true : false};

    optionsToSet;
    @api get options(){ return this.optionsToSet };
    set options(value){
        try {
            this.optionsToSet = value;
            // console.log('options : ', this.optionsToSet);
            this.setDisplayOptions();
        } catch (error) {
            console.log('log in set option : ', error.stack);
        }
    }

    valueToSet;
    @api get value(){ return this.valueToSet };
    set value(value){
        try {
            this.valueToSet = value;
            if(value && this.optionsToSet){
                this.setDefaultSection();
            }
            else{
                this.selectedOptionLabel = null;
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
        if(value == 'true'){
            this.setDropDownPosition = this.setDropDownPosition + `
                top: auto !important;
                bottom: 100% !important;
            `
        }
    }

    @api placeholder;
    @track placeholderText = ''             // to set placeholder in markup as per multi select options
    
    @track displayOptions = [];              // to display option in dropdown
    @track selectedItems = [];              // to set store and send selected option to parent component
    @track selectedOptionLabel = null;      // to display selected option in markup (for single select)
    
    allOptions = [];                        // All Option List Modified Keys....

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


    connectedCallback(){
        try {
            this.setPlaceHolder();
        } catch (error) {
            console.error('error inside connectedCallback in custom combobox : ', error.stack);
        }
    }

    setDisplayOptions(){
        try {
            if(this.options && this.options.length){
                this.allOptions = JSON.parse(JSON.stringify(this.options));
    
                var tempOptions = JSON.parse(JSON.stringify(this.options));
                tempOptions.forEach(ele => {
                    ele['isSelected'] = false;                                  // by default set all option as unselected
                    ele['originalIndex'] = tempOptions.indexOf(ele);            // set original index of option for re-sorting
                });
    
                this.allOptions = tempOptions;
                this.displayOptions = tempOptions;
    
                if(this.value){
                    this.setDefaultSection();
                }
                else{
                    this.selectedOptionLabel = null;
                }
            }

        } catch (error) {
            console.error('error inside  in setDisplayOptions  in custom combobox : ', error.stack);
        }
    }

    // Set default value if user passes value...
    setDefaultSection(){
        try {
            var currentOption = this.displayOptions.find(option => option.value == this.value)
            if(currentOption && !currentOption.disabled){
                if(this.multiselect){
                    if(currentOption && !currentOption.isSelected){
                        this.selectedItems.push(currentOption);
                    }
                    else{
                        this.selectedItems = this.selectedItems.filter((selectedOption) => {
                            return selectedOption.originalIndex != originalIndex;
                        });
                    }
                }
                else{
                        this.selectedOptionLabel = currentOption ? currentOption.label : null;
                            
                        this.selectedItems = currentOption ? [currentOption] : [];
                }
                this.setSelection();
                this.setPlaceHolder();
            }
        } catch (error) {
            console.error('error in setDefaultSection custom combobox : ', error.stack);
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
            console.error('error inside handleShowDropDown in custom combobox : ', error.stack);
        }
    }

	handleInputBlur(){
		this.dispatchEvent(new CustomEvent('blur'));
	}

    handleSearch(event){
        try {
            // console.log('search Value : ', event.target.value);
            // this.selectedOptionLabel = event.target.value;
            var searchValue = (event.target.value).toLowerCase();
            if(searchValue == null || searchValue.trim() == '' || searchValue == undefined){
                this.displayOptions = this.allOptions;
            }
            else{
                this.displayOptions = this.allOptions.filter((ele) => {
                    return ele.label.toLowerCase().includes(searchValue)
                });
            };
            // sort After each Search
            this.sortDisplayItems();
        } catch (error) {
            console.error('error inside handleSearch in custom combobox : ', error.stack);
        }
    }

    // this method use to send value to parent component on option selection....
    handleOptionClick(event){
        try {
            // Use Original Index as unique Value and comparison...
            var originalIndex = event.currentTarget.dataset.oriindex;
            const currentOption = JSON.parse(JSON.stringify(this.displayOptions.find(option => option.originalIndex == originalIndex)));
            if(!currentOption.disabled){
                if(this.multiselect){
    
                    // Assign or remove clicked option from selected list...
                    if(!currentOption.isSelected){
                        this.selectedItems.push(currentOption);
                    }
                    else{
                        this.selectedItems = this.selectedItems.filter((selectedOption) => {
                            return selectedOption.originalIndex != originalIndex;
                        });
                    }
                    this.setSelection();
                    this.setPlaceHolder();
    
                    // this logic create a list of selected options with original values...(remove additonal keys...)
                    var selectedOptionList = [] ;
                    this.selectedItems.forEach((selectedOption) => {
                        selectedOptionList.push(this.options[selectedOption.originalIndex].value);
                    });
    
                    // Send data to parent compoent...
                    this.dispatchEvent(new CustomEvent('select',{
                        detail : selectedOptionList
                    }));
    
                }
                else{
                    
                    this.selectedOptionLabel = event.currentTarget.dataset.label;
                    
                    this.selectedItems = [currentOption];
                    this.setSelection();
    
                    // this logic create a new variable of selected options with original values...(remove additonal key-values...)
                    const selectedOption = this.options[currentOption.originalIndex].value;
    
                    // if combobox is not multi-select it will return array with only one element...
                    this.dispatchEvent(new CustomEvent('select',{detail : 
                        [selectedOption]
                    }));
               
                    this.closeDropDown();
                }
    
                this.setErrorBorder();
            }
            
        } catch (error) {
            console.error('error inside handleItemClick in custom combobox : ', error.stack);
        }
    }

    //this method only for Single select Combo-Box
    clearSelection(event){ 
        try {
            this.selectedOptionLabel = null;
            this.selectedItems = [];

            this.displayOptions.forEach(option => {option.isSelected = false;});
            this.allOptions.forEach(option => {option.isSelected = false;});

            // Send Null Data to parent Component...
            this.dispatchEvent(new CustomEvent('select',{detail : 
                []
            }));

            this.setErrorBorder();
            this.setPlaceHolder();
        } catch (error) {
            console.error('error in clearSelection custom combobox : ', error.stack);
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
            console.error('error inside closeDropDown in custom combobox : ', error.stack);
        }
    }

    // Generic Method -> to update initial options list and display option list...as option select and unselect...
    setSelection(){
        try {
            this.displayOptions.forEach(options => { options.isSelected = this.selectedItems.length ? this.selectedItems.some(ele => ele.originalIndex == options.originalIndex) : false});
            this.allOptions.forEach(options => { options.isSelected = this.selectedItems.length ? this.selectedItems.some(ele => ele.originalIndex == options.originalIndex) : false});
        } catch (error) {
            console.error('error in setSelection : ', error.stack);
        }
    }

    // Generic Method -> to Set place older as user select or unselect options... (Generally used for multi-Select combobox)
    setPlaceHolder(){
        if(this.selectedItems.length <= 0){
            this.placeholderText = this.placeholder ? this.placeholder : (this.multiselect ? 'Select an Options...' : 'Select an Option...');
        }
        else{
            var length = this.selectedItems.length;
            this.placeholderText = this.selectedItems.length + (length == 1 ? ' option' : ' options') + ' selected';
        }
    }

    //Generic Method -> to Set error border if combobox is required == true and no option selected...
    setErrorBorder(){
        try {
            if(this.required){
                if((this.multiselect && this.selectedItems.length == 0) || (!this.multiselect && this.selectedOptionLabel == null)){
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
            console.error('error in setErrorBorder in custom combobox  : ', error.stack);
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
            console.error('error in sortDisplayItems in custom combobox : ', error.stack);
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
            this.selectedItems = this.selectedItems.filter((option) => {
                option.isSelected = false;
                return option.value != unselectedOption;
            });

            this.setSelection();
            this.setErrorBorder();
            this.setPlaceHolder();
        } catch (error) {
            console.error('error in unselectOption in custom combobox : ', error.stack);
        }
    }

    // Clear all value from parent component....
    @api
    clearValue(){
        try {
            if(this.multiselect){
                if(this.selectedItems.length > 0){
                    this.selectedItems = this.selectedItems.filter((option) => {
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
            console.error('error in clearAll in custom combobox : ', error.stack);
        }
    }

    // Reset value to default value from parent component....
    @api
    resetValue(){
        this.clearValue();
        if(this.value){
            this.setDefaultSection();
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
            console.error('error in isInvalidInput : ', error.stack);
            
        }
    }
}