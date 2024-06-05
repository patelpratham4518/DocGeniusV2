public with sharing class DropBoxAuthorizationController {

    @AuraEnabled
    public static Map<String, Object> checkdropboxauth(){
        try{
            DropBoxAuthProviderSettings__c settings = DropBoxAuthProviderSettings__c.getInstance();
            Map<String, Object> result = new Map<String, Object>();
            if (settings != null && settings.refresh_token__c != null && settings.access_token__c != null && settings.LinkedDate__c != null) {
                    result.put('name', settings.username__c);
                    result.put('email', settings.email__c);
                    result.put('linkdate', settings.LinkedDate__c);
                    result.put('active', settings.WorkingStatus__c);
                return result;
            }
            result.put('error', 'Error obtaining details: ');
            return result;
        }catch(Exception e){
            Log_Handler.store_Exception(e, 'DropBoxAuthorizationController', 'checkdropboxauth');
            System.debug('Exception of checkdropboxauth got invoked');
            return null;
        }
    }

    @AuraEnabled
    public static Boolean unauthorize(){
        try {
            DropBoxAuthProviderSettings__c settings = DropBoxAuthProviderSettings__c.getInstance();
        if(settings != null){
            settings.ClientId__c = '';
            settings.ClientSecret__c = '';
            settings.username__c = '';
            settings.LinkedDate__c = '';
            settings.email__c = '';
            settings.refresh_token__c = '';
            settings.access_token__c = '';
            settings.WorkingStatus__c = false;
            upsert settings;
            return true;
        }
        return false;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'DropBoxAuthorizationController', 'unauthorize');
            System.debug('Exception of unauthorize got invoked');
            return null;
        }
        
    }

    @AuraEnabled
    public static String authorize(String clientId, String clientSecret) {
        if (String.isBlank(clientId) || String.isBlank(clientSecret)) {
            System.debug('looks fishy');
            return 'Both Client ID and Client Secret are required.';
        }

        DropBoxAuthProviderSettings__c settings = DropBoxAuthProviderSettings__c.getInstance();
        if (settings == null) {
            settings = new DropBoxAuthProviderSettings__c();
        }
        settings.ClientId__c = clientId;
        settings.ClientSecret__c = clientSecret;

        String durl = authcode(clientId, clientSecret);
        System.debug('before upsert');
        upsert settings;
        System.debug(durl);
        return durl;
    }

    @AuraEnabled
    public static String redirectUrl(){
            try {
                String url = ''+System.Url.getOrgDomainUrl();
                String REDIRECT_URI = '';
                if(url.contains('develop.my.salesforce.com')) {
                System.debug('System org url -->'+url);
                String baseUrl = url.substringBeforeLast('.develop.my.salesforce.com');
                baseUrl = baseUrl.substringAfter('Url:[delegate=');
                REDIRECT_URI = baseUrl + '--c.develop.vf.force.com/apex/dropboxSuccessPage';
                }else if(url.contains('sandbox.my.salesforce.com')){
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.sandbox.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.sandbox.vf.force.com/apex/dropboxSuccessPage';
                }else if(url.contains('scratch.my.salesforce.com')){
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.scratch.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.scratch.vf.force.com/apex/dropboxSuccessPage';
                }else {
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.vf.force.com/apex/dropboxSuccessPage';
                }
                return REDIRECT_URI;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'DropBoxAuthorizationController', 'redirectUrl');
                System.debug('Exception of redirecturl got invoked');
                return null;
            }
            
    }

    @AuraEnabled
    public static string authcode(String clientId, String clientSecret){
        String REDIRECT_URI = redirecturl(); 
        System.debug('redirect uri -->'+REDIRECT_URI);
        String AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';
        String DROP_BOX_SCOPES = 'files.content.read files.content.write account_info.read';
        String authUrl = AUTH_URL + '?response_type=code' +
                        '&client_id=' + clientId +
                        '&redirect_uri=' + REDIRECT_URI +
                        '&token_access_type=offline' +
                        '&approval_prompt=force' +
                        '&state=state_parameter_passthrough_value' +
                        '&scope=' + DROP_BOX_SCOPES +
                        '&response_mode=query';
        return authUrl;
    }
}