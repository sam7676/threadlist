    // Initialising the page and adding listeners
    var form_page = 1;
    var max_page = 1;

    update_form_max();
    update_thread_display();

    document.getElementById("get-threads").addEventListener("click", update_thread_display);
    document.getElementById("backthread").addEventListener("click", decrement_form_page);
    document.getElementById("nextthread").addEventListener("click", increment_form_page);

    // Increments the thread page we are currently on, and modifies the form_page attribute
    function increment_form_page() {
        if (form_page + 1 <= max_page) {
            form_page = form_page + 1;
        }
        update_thread_display()
        update_form_max()
    }

    // Increments the thread page we are currently on, and modifies the form_page attribute
    function decrement_form_page() {
        if (form_page - 1 >= 1) {
            form_page = form_page - 1;
        }
        update_thread_display()
        update_form_max()
    }

    // Updates the page numbers for the thread page
    function update_form_max() {
        document.getElementById("formpage").innerHTML = form_page;
        get_page_count();
        max_page = document.getElementById("maxpage").innerHTML
    }


    function update_table(data) {
        var data_arr = []
        for(var i in data) {
            var temp_arr = []
            for (var j in data[i]) {
                temp_arr.push(data[i][j])
            }
            data_arr.push(temp_arr);
        }

        console.log(data_arr)

        table = document.getElementById("thread-table")

        var rows = table.rows;
        console.log(rows.length)
        for (let i = 0; i < rows.length; i++) {

            rows[i].cells[0].innerHTML = data_arr[i][1]
            rows[i].cells[1].innerHTML = data_arr[i][0]
            rows[i].cells[2].innerHTML = data_arr[i][3]
            rows[i].cells[3].innerHTML = data_arr[i][4]
            rows[i].cells[4].innerHTML = data_arr[i][5]


        }

    }

    // Updates which threads are currently shown to the user
    function update_thread_display() {
        var select_option = document.getElementById("sortby")
        var select_value = select_option.options[select_option.selectedIndex].value;

        var search_item = document.getElementById("search").value
        

        fetch("./threads?" + new URLSearchParams({
            'select': select_value,
            'search': search_item,
            'page': form_page,
        }), { method: "GET" })
            .then(
                (response) => response.json()

            )
            .then(
                (json => update_table(json))
            )




    }

    // Gets the number of pages of threads in the application
    function get_page_count() {

        fetch("./getpagecount", { method: "GET" })
            .then(
                (response) => response.json()

            )
            .then(
                (json =>
                    document.getElementById("maxpage").innerHTML = json["page_count"])
            )

    }



