// Initialising the page and adding listeners
var form_page = 1;
var max_page = 1;
var selected_thread = null;

update_form_max();
update_thread_display();

document.getElementById("get-threads").addEventListener("click", update_thread_display);
document.getElementById("new-thread").addEventListener("click", show_new_thread);
document.getElementById("backthread").addEventListener("click", decrement_form_page);
document.getElementById("nextthread").addEventListener("click", increment_form_page);


// Increments the thread page we are currently on, and modifies the form_page attribute
function increment_form_page() {
    if (form_page + 1 <= max_page) {
        form_page = form_page + 1;
    }
    update_thread_display()
}

// Increments the thread page we are currently on, and modifies the form_page attribute
function decrement_form_page() {
    if (form_page - 1 >= 1) {
        form_page = form_page - 1;
    }
    update_thread_display()
}

// Updates the page numbers for the thread page
function update_form_max() {
    document.getElementById("formpage").innerHTML = form_page;
    get_page_count();
    max_page = document.getElementById("maxpage").innerHTML
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
    for (let i = 0; i < rows.length; i++) {

        rows[i].cells[0].innerHTML = data_arr[i][1]
        rows[i].cells[1].innerHTML = data_arr[i][0]
        rows[i].cells[2].innerHTML = data_arr[i][3]
        rows[i].cells[3].innerHTML = data_arr[i][4]
        rows[i].cells[4].innerHTML = data_arr[i][5]


    }

}

// Updates which threads are currently shown to the user
async function update_thread_display() {

    var select_option = document.getElementById("sortby")
    var select_value = select_option.options[select_option.selectedIndex].value;
    var search_item = document.getElementById("search").value


    var promise = await fetch("./threads?" + new URLSearchParams({
        'select': select_value,
        'search': search_item,
        'page': form_page,
    }), { method: "GET" })
    

    result_json = await promise.json()
    update_table(result_json)
    update_form_max()
}

// Gets the number of pages of threads in the application
async function get_page_count() {

    promise = await fetch("./getpagecount", { method: "GET" })
    json_obj = await promise.json()
    document.getElementById("maxpage").innerHTML = json_obj["page_count"]
}

function select_row(row) {
    var rowID = 'row'.concat(row.toString())
    var row_element = document.getElementById(rowID)
    selected_thread = row_element.cells[1].innerHTML;
    view_thread()
}

// Creates a new thread and loads the new thread HTML document
function show_new_thread() {
    var frame = document.getElementById("extra-content");
    frame.src = './new-thread.html';
}

function view_thread() {
    var frame = document.getElementById("extra-content");
    frame.src = './view-thread.html';
}

// Clears the extra content frame
function close_frame() {
    var frame = document.getElementById("extra-content")
    frame.src = 'about:blank'
    selected_thread = null;

}



