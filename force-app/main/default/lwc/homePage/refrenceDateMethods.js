export function setRefrenceDates(){
    try {

        let todayDate = new Date();

        let firstDayofThisWeek = new Date(todayDate);
        firstDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay());

        let lastDayofThisWeek = new Date(todayDate);
        lastDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay() + 6);

        let lastDayOfPreviousWeek = new Date(todayDate);
        lastDayOfPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 1);

        let firstDayofPreviousWeek = new Date(todayDate);
        firstDayofPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 7);

        let firstDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 2);
        let lastDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);

        let lastDayOfPreviousMonth = new Date(todayDate);
        lastDayOfPreviousMonth.setDate(todayDate.getMonth() - todayDate.getMonth());

        let firstDayofPreviousMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 2);


        var refrenceDates = {}
        refrenceDates.todayDate = todayDate.toISOString().split('T')[0];
        refrenceDates.firstDayofThisWeek = firstDayofThisWeek.toISOString().split('T')[0];
        refrenceDates.lastDayofThisWeek = lastDayofThisWeek.toISOString().split('T')[0];
        refrenceDates.lastDayOfPreviousWeek = lastDayOfPreviousWeek.toISOString().split('T')[0];
        refrenceDates.firstDayofPreviousWeek = firstDayofPreviousWeek.toISOString().split('T')[0];
        refrenceDates.firstDayofPreviousMonth = firstDayofPreviousMonth.toISOString().split('T')[0];
        refrenceDates.lastDayOfPreviousMonth = lastDayOfPreviousMonth.toISOString().split('T')[0];
        refrenceDates.firstDayofThisMonth = firstDayofThisMonth.toISOString().split('T')[0];
        refrenceDates.lastDayofThisMonth = lastDayofThisMonth.toISOString().split('T')[0];

        return refrenceDates;
    } catch (error) {
        console.error('error in setRefrenceDate : ', error.stack); 
    }
}