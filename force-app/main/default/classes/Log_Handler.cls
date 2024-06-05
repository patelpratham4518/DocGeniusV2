public class Log_Handler {


    public static void store_Exception(Exception e,String classname, String methodname) {
        try{
            Exception_Logs__c error = new Exception_Logs__c();

            //Governer Limit of executingQuery 
            String QueryLimit = '1. SOQL Queries used / SOQL Queries allowed: ' + Limits.getQueries() + '/' + Limits.getLimitQueries();
            String DMLimit = '2. Number of records queried so far /  Number allowed: ' + Limits.getDmlRows() + '/' + Limits.getLimitDmlRows();
            String DMLStat = '3. Number of DML statements used so far / Number allowed: ' +  Limits.getDmlStatements() + '/' + Limits.getLimitDmlStatements();   
            String CPUT = '4. Amount of CPU time (in ms) used so far / CPU usage time (in ms) allowed: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime();
        
            error.Governer_Limits__c = String.format('{0}\n{1}\n{2}\n{3}',new List<string>{QueryLimit, DMLimit,DMLStat,CPUT});
            error.Exception_Message__c = e.getMessage();
            error.Exception_Type__c = e.getTypeName();
            error.Exception_Line_Numer__c = e.getLineNumber();
            error.Exception_Stack_Trace__c = e.getStackTraceString();
            error.Class_Name__c = classname;
            error.Method_Name__c = methodname;
        
            insert error;
            
        } 
        catch (Exception error) {
            system.debug('error in Store_Exception >> '+ error);
        }
    } 
    
}