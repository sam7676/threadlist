// Initialising the page and adding listeners
var form_page = 1;
var max_page = 1;
var selected_thread = null;
var frame = document.getElementById("extra-content");

update_form_max();
update_thread_display();

document.getElementById("get-threads").addEventListener("click", update_thread_display);
document.getElementById("new-thread").addEventListener("click", show_new_thread);
document.getElementById("backthread").addEventListener("click", decrement_form_page);
document.getElementById("nextthread").addEventListener("click", increment_form_page);

const num_to_month_map = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec"
}

const THREAD_ID_INDEX = 0
const THREAD_TITLE_INDEX = 1
const THREAD_BODY_INDEX = 2
const THREAD_DATES_INDEX = 3
const THREAD_UPDATE_INDEX = 4
const THREAD_LIKES_INDEX = 5
const THREAD_COMMENTS_INDEX = 6
const HEART_UNICODE = '❤'
const COMMENT_UNICODE = '🗨'
const TITLE_CHAR_MAX = 50
const HIDDEN_CHAR = '⁠&#8288;'

// Converts a one or two-digit number into a two-digit string.
// No validation needed, as the result comes from the server.
function make_double_digit(s) {
    if (s == '_') {
        return s;
    }
    let t = s.toString()
    if (t.length == 1) {
        return '0'.concat(t)
    }
    else {
        return t
    }
}

// If the string is valid (thread array index != '_'), returns the string
// Otherwise compacts the HTML table with an empty character
function return_string_if_valid(str) {
    if (str == '_') {
        return HIDDEN_CHAR
    }
    else {
        return str
    }
}

// Increments/decrements the thread page we are currently on, and modifies the form_page attribute
function increment_form_page() {
    if (form_page + 1 <= max_page) {
        form_page = form_page + 1;
    }
    update_thread_display()
}
function decrement_form_page() {
    if (form_page - 1 >= 1) {
        form_page = form_page - 1;
    }
    update_thread_display()
}

// Updates the page numbers for the thread page
async function update_form_max() {
    document.getElementById("formpage").innerHTML = form_page;
    get_page_count();
}

// Updates the table with data given
function update_table(data) {
    var data_arr = []
    for (var i in data) {
        var temp_arr = []
        for (var j in data[i]) {
            temp_arr.push(data[i][j])
        }
        data_arr.push(temp_arr);
    }

    var table = document.getElementById("thread-table")

    var rows = table.rows;
    for (let i = 1; i < rows.length; i++) {

        rows[i].cells[0].innerHTML = return_string_if_valid(data_arr[i - 1][THREAD_TITLE_INDEX])
        rows[i].cells[1].innerHTML = data_arr[i - 1][THREAD_ID_INDEX]
        rows[i].cells[2].innerHTML = return_string_if_valid(date_to_readable(data_arr[i - 1][THREAD_DATES_INDEX]))
        rows[i].cells[3].innerHTML = return_string_if_valid(date_to_readable(data_arr[i - 1][THREAD_UPDATE_INDEX]))
        rows[i].cells[4].innerHTML = return_string_if_valid(add_char(HEART_UNICODE, data_arr[i - 1][THREAD_LIKES_INDEX]))
        rows[i].cells[5].innerHTML = return_string_if_valid(add_char(COMMENT_UNICODE, data_arr[i - 1][THREAD_COMMENTS_INDEX]))

    }


}

// Updates which threads are currently shown to the user
async function update_thread_display() {

    await get_page_count()
    if (form_page > max_page) {
        form_page = form_page - 1;
    }

    let select_option = document.getElementById("sortby")
    let select_value = select_option.options[select_option.selectedIndex].value;
    let search_item = document.getElementById("search").value


    const promise = await fetch("./threads?" + new URLSearchParams({
        'select': select_value,
        'search': search_item,
        'page': form_page,
    }), { method: "GET" })


    const result_json = await promise.json()
    update_table(result_json)
    update_form_max()
}

// Gets the number of pages of threads in the application
async function get_page_count() {
    const promise = await fetch("./getpagecount", { method: "GET" })
    const json_obj = await promise.json()
    max_page = json_obj["page_count"]
    document.getElementById("maxpage").innerHTML = max_page;
}

// If a thread is clicked on, selects the thread and triggers the view_thread script
function select_row(row) {
    var rowID = 'row'.concat(row.toString())
    var row_element = document.getElementById(rowID)
    selected_thread = row_element.cells[1].innerHTML;
    if (selected_thread == '_') {
        alert("Cannot select invalid thread")
    }
    else {
        view_thread()
    }
}

// Converts a date string object (returned from the backend) into a more readable format
function date_to_readable(str) {
    if (str == '_') {
        return str;
    }
    let arr = str.split("-")
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(arr[i]);
    }


    // YEAR MONTH DAY HOURS MINUTES SECONDS
    //    0     1   2     3       4       5
    arr[1] = make_double_digit(arr[1])
    arr[2] = make_double_digit(arr[2])
    arr[3] = make_double_digit(arr[3])
    arr[4] = make_double_digit(arr[4])


    return `${arr[1]}/${arr[2]}/${arr[0]} ${arr[3]}:${arr[4]}`
}

// Inserts a character at the beginning of a string
function add_char(c, str) {
    if (str == '_') {
        return str
    }
    return c.concat(' ', str)
}

// Creates a new thread and loads the new thread HTML document
function show_new_thread() {
    frame.src = './new-thread.html';
}

// Views a thread, using the selected_thread variable
function view_thread() {
    frame.src = './view-thread.html';
}

// Clears the extra content frame
function close_frame() {
    frame.src = 'about:blank'
    selected_thread = null;
}



