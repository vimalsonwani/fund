/**********************************************************************
 * Staff Club Fund Dashboard
 * app.js (Part 1)
 **********************************************************************/

/* ==========================================================
   CONFIGURATION
========================================================== */

const API_URL =
"https://script.google.com/macros/s/AKfycbzSRnK4E2xUw91Yc68yRGaCBJmrPyH7R44uk0LLGOcFWe9mkxZqQfNpjhcInI89aaLW/exec";

/* ==========================================================
   APPLICATION STATE
========================================================== */

let apiData = {};

let transactions = [];

let staff = [];

let selectedStaff = new Set();

let selectedMonth = "";

let filteredTransactions = [];

let collectionChart = null;

let pieChart = null;

/* ==========================================================
   DOM ELEMENTS
========================================================== */

const loadingScreen = document.getElementById("loadingScreen");

const errorBox = document.getElementById("errorBox");

const errorMessage = document.getElementById("errorMessage");

const statusBar = document.getElementById("statusBar");

const monthSelect = document.getElementById("monthSelect");

const staffList = document.getElementById("staffList");

const defaulterList = document.getElementById("defaulterList");

const paidMembers = document.getElementById("paidMembers");

const transactionTable = document.getElementById("transactionTable");

/* ==========================================================
   HELPERS
========================================================== */

function money(value){

    return "₹" +

    Number(value || 0)

    .toLocaleString("en-IN");

}

function escapeHtml(str){

    return String(str ?? "")

    .replace(/&/g,"&amp;")

    .replace(/</g,"&lt;")

    .replace(/>/g,"&gt;")

    .replace(/"/g,"&quot;")

    .replace(/'/g,"&#39;");

}

function monthKey(date){

    const d = new Date(date);

    if(isNaN(d)) return "";

    return d.getFullYear()

    + "-"

    + String(d.getMonth()+1)

      .padStart(2,"0");

}

function monthLabel(key){

    const [y,m] = key.split("-");

    return new Date(

        Number(y),

        Number(m)-1,

        1

    ).toLocaleDateString(

        "en-IN",

        {

            month:"long",

            year:"numeric"

        }

    );

}

function formatDate(date){

    const d = new Date(date);

    if(isNaN(d))

        return "-";

    return d.toLocaleDateString(

        "en-GB",

        {

            day:"2-digit",

            month:"short",

            year:"numeric"

        }

    );

}

/* ==========================================================
   LOADING
========================================================== */

function showLoading(){

    loadingScreen.classList.remove("hidden");

}

function hideLoading(){

    loadingScreen.classList.add("hidden");

}

function showError(msg){

    errorMessage.innerText = msg;

    errorBox.classList.remove("hidden");

}

function hideError(){

    errorBox.classList.add("hidden");

}

function setStatus(msg){

    statusBar.innerText = msg;

    statusBar.classList.remove("hidden");

}

/* ==========================================================
   API
========================================================== */

async function loadData(){

    showLoading();

    hideError();

    try{

        const response = await fetch(

            API_URL,

            {

                cache:"no-store"

            }

        );

        const text = await response.text();

        console.log(text);

        if(!response.ok){

            throw new Error(

                "HTTP "

                + response.status

            );

        }

        apiData = JSON.parse(text);

        if(apiData.success===false){

            throw new Error(

                apiData.error

            );

        }

        transactions =

        apiData.transactions || [];

        staff =

        apiData.staff || [];

        filteredTransactions =

        [...transactions];

        buildMonthList();

        buildStaffList();

        updateDashboard();

        hideLoading();

        setStatus(

            "Loaded "

            + transactions.length

            + " transactions"

        );

    }

    catch(err){

        console.error(err);

        hideLoading();

        showError(

            err.message

        );

    }

}

/* ==========================================================
   MONTH LIST
========================================================== */

function buildMonthList(){

    const months =

    [...new Set(

        transactions.map(t=>

            monthKey(t.date)

        )

    )]

    .sort()

    .reverse();

    monthSelect.innerHTML =

    months.map(m=>`

<option value="${m}">

${monthLabel(m)}

</option>

`).join("");

    if(months.length){

        selectedMonth = months[0];

        monthSelect.value =

        selectedMonth;

    }

}

/* ==========================================================
   INITIALIZE
========================================================== */

document.addEventListener(

"DOMContentLoaded",

()=>{

    loadData();

});
/**********************************************************************
 * app.js (Part 2A)
 * Dashboard Summary + Staff Selector
 **********************************************************************/

/* ==========================================================
   DASHBOARD
========================================================== */

function updateDashboard() {

    updateSummaryCards();

    renderMonthlySummary();

    renderTransactionTable(filteredTransactions);

}

/* ==========================================================
   OVERALL SUMMARY
========================================================== */

function updateSummaryCards() {

    let credit = 0;
    let debit = 0;

    transactions.forEach(t => {

        const amount = Number(t.amount) || 0;

        if (String(t.type).toLowerCase() === "credit") {
            credit += amount;
        }

        if (String(t.type).toLowerCase() === "debit") {
            debit += amount;
        }

    });

    document.getElementById("totalCredit").innerText =
        money(credit);

    document.getElementById("totalDebit").innerText =
        money(debit);

    document.getElementById("balance").innerText =
        money(credit - debit);

}

/* ==========================================================
   MONTHLY SUMMARY
========================================================== */

function renderMonthlySummary() {

    selectedMonth = monthSelect.value;

    const monthTransactions = transactions.filter(t =>

        monthKey(t.date) === selectedMonth

    );

    let credit = 0;
    let debit = 0;

    monthTransactions.forEach(t => {

        const amount = Number(t.amount) || 0;

        if (String(t.type).toLowerCase() === "credit")
            credit += amount;

        if (String(t.type).toLowerCase() === "debit")
            debit += amount;

    });

    document.getElementById("monthCredit").innerText =
        money(credit);

    document.getElementById("monthDebit").innerText =
        money(debit);

    document.getElementById("monthBalance").innerText =
        money(credit - debit);

    updateProgress(monthTransactions);

    renderPaidMembers(monthTransactions);

    renderDefaulters(monthTransactions);

}

/* ==========================================================
   STAFF LIST
========================================================== */

function buildStaffList() {

    selectedStaff.clear();

    staff.sort((a, b) => a.localeCompare(b));

    staff.forEach(name =>

        selectedStaff.add(name)

    );

    staffList.innerHTML =

        staff.map(name => `

<label class="staff-chip">

<input
type="checkbox"
checked
value="${escapeHtml(name)}">

<span>

${escapeHtml(name)}

</span>

</label>

`).join("");

    document

        .querySelectorAll(".staff-chip input")

        .forEach(cb => {

            cb.addEventListener("change", () => {

                if (cb.checked)
                    selectedStaff.add(cb.value);

                else
                    selectedStaff.delete(cb.value);

                renderMonthlySummary();

            });

        });

}

/* ==========================================================
   SELECT ALL
========================================================== */

document

.getElementById("selectAll")

.addEventListener("click", () => {

    selectedStaff.clear();

    document

        .querySelectorAll(".staff-chip input")

        .forEach(cb => {

            cb.checked = true;

            selectedStaff.add(cb.value);

        });

    renderMonthlySummary();

});

/* ==========================================================
   CLEAR ALL
========================================================== */

document

.getElementById("clearAll")

.addEventListener("click", () => {

    selectedStaff.clear();

    document

        .querySelectorAll(".staff-chip input")

        .forEach(cb => {

            cb.checked = false;

        });

    renderMonthlySummary();

});

/* ==========================================================
   MONTH CHANGE
========================================================== */

monthSelect.addEventListener(

    "change",

    () => {

        renderMonthlySummary();

    }

);
/**********************************************************************
 * app.js (Part 2B)
 * Progress Bar + Paid Members + Defaulters
 **********************************************************************/

/* ==========================================================
   PAID MEMBERS
========================================================== */

function getPaidMembers(monthTransactions) {

    const paid = new Set();

    monthTransactions.forEach(t => {

        if (String(t.type).toLowerCase() !== "credit")
            return;

        paid.add(
            String(t.name).trim().toLowerCase()
        );

    });

    return paid;

}

/* ==========================================================
   PROGRESS
========================================================== */

function updateProgress(monthTransactions) {

    const paid = getPaidMembers(monthTransactions);

    const selected = [...selectedStaff];

    const paidSelected = selected.filter(name =>

        paid.has(name.trim().toLowerCase())

    );

    const total = selected.length;

    const paidCount = paidSelected.length;

    const pending = total - paidCount;

    const percent = total
        ? Math.round((paidCount / total) * 100)
        : 0;

    document.getElementById("progressBar").style.width =
        percent + "%";

    document.getElementById("progressText").innerText =
        percent + "%";

    document.getElementById("paidCount").innerText =
        paidCount + " Paid";

    document.getElementById("pendingCount").innerText =
        pending + " Pending";

    document.getElementById("collectionPercent").innerText =
        percent + "%";

}

/* ==========================================================
   PAID MEMBERS LIST
========================================================== */

function renderPaidMembers(monthTransactions) {

    const paid = getPaidMembers(monthTransactions);

    const selected = [...selectedStaff];

    const paidMembersList = selected
        .filter(name =>

            paid.has(name.trim().toLowerCase())

        )
        .sort((a, b) => a.localeCompare(b));

    document.getElementById("paidMemberTotal").innerText =
        paidMembersList.length + " Members";

    if (!paidMembersList.length) {

        paidMembers.innerHTML = `

<div class="text-gray-400">

No contribution received.

</div>

`;

        return;

    }

    paidMembers.innerHTML = paidMembersList.map(name => `

<div class="paid-badge">

${escapeHtml(name)}

</div>

`).join("");

}

/* ==========================================================
   DEFAULTERS
========================================================== */

function renderDefaulters(monthTransactions) {

    const paid = getPaidMembers(monthTransactions);

    const defaulters = [...selectedStaff]

        .filter(name =>

            !paid.has(

                name.trim().toLowerCase()

            )

        )

        .sort((a, b) =>

            a.localeCompare(b)

        );

    if (!defaulters.length) {

        defaulterList.innerHTML = `

<div class="text-green-700 font-semibold">

🎉 Everyone has paid.

</div>

`;

        return;

    }

    defaulterList.innerHTML =

        defaulters.map(name => `

<div class="defaulter-badge">

${escapeHtml(name)}

</div>

`).join("");

}

/* ==========================================================
   STAFF SEARCH
========================================================== */

document.getElementById("staffSearch")

.addEventListener(

"input",

function(){

    const q =

    this.value

    .trim()

    .toLowerCase();

    document

    .querySelectorAll(".staff-chip")

    .forEach(chip=>{

        const text =

        chip.innerText

        .toLowerCase();

        chip.style.display =

        text.includes(q)

        ? ""

        : "none";

    });

});
/**********************************************************************
 * app.js (Part 3)
 * Transaction Table + Search + CSV Export + Refresh
 **********************************************************************/

/* ==========================================================
   TRANSACTION TABLE
========================================================== */

function renderTransactionTable(data) {

    if (!Array.isArray(data) || data.length === 0) {

        transactionTable.innerHTML = `
<tr>
<td colspan="6" class="text-center py-8 text-gray-500">
No transactions found
</td>
</tr>`;

        return;

    }

    const rows = [...data].sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    });

    transactionTable.innerHTML = rows.map(t => {

        const badge = String(t.type).toLowerCase() === "credit"

            ? `<span class="badge credit">Credit</span>`

            : `<span class="badge debit">Debit</span>`;

        return `

<tr>

<td>${formatDate(t.date)}</td>

<td>${escapeHtml(t.name)}</td>

<td>${badge}</td>

<td class="text-right">

${money(t.amount)}

</td>

<td>

${escapeHtml(t.remarks || "")}

</td>

<td>

${escapeHtml(t.source || "")}

</td>

</tr>

`;

    }).join("");

}

/* ==========================================================
   SEARCH
========================================================== */

const searchBox = document.getElementById("searchBox");

searchBox.addEventListener("input", function () {

    const keyword = this.value
        .trim()
        .toLowerCase();

    filteredTransactions = transactions.filter(t => {

        return (

            String(t.name)
                .toLowerCase()
                .includes(keyword)

            ||

            String(t.type)
                .toLowerCase()
                .includes(keyword)

            ||

            String(t.remarks || "")
                .toLowerCase()
                .includes(keyword)

            ||

            String(t.source || "")
                .toLowerCase()
                .includes(keyword)

        );

    });

    renderTransactionTable(filteredTransactions);

});

/* ==========================================================
   CSV EXPORT
========================================================== */

document
.getElementById("exportBtn")
.addEventListener("click", exportCSV);

function exportCSV() {

    const rows = [

        [

            "Date",

            "Name",

            "Type",

            "Amount",

            "Remarks",

            "Source"

        ]

    ];

    filteredTransactions.forEach(t => {

        rows.push([

            formatDate(t.date),

            t.name,

            t.type,

            t.amount,

            t.remarks || "",

            t.source || ""

        ]);

    });

    const csv = rows

        .map(r =>

            r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")

        )

        .join("\n");

    const blob = new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =

        "staff-fund-transactions.csv";

    a.click();

    URL.revokeObjectURL(url);

    showToast("CSV exported");

}

/* ==========================================================
   REFRESH
========================================================== */

document

.getElementById("refreshBtn")

.addEventListener("click",()=>{

    loadData();

    showToast("Dashboard refreshed");

});

/* ==========================================================
   TOAST
========================================================== */

function showToast(message){

    const toast =

    document.getElementById("toast");

    const body =

    document.getElementById("toastBody");

    body.innerText = message;

    toast.classList.remove("hidden");

    setTimeout(()=>{

        toast.classList.add("hidden");

    },2500);

}
/**********************************************************************
 * app.js (Part 4)
 * Charts + Dark Mode + Auto Refresh + Initialization
 **********************************************************************/

/* ==========================================================
   CHARTS
========================================================== */

function buildCharts() {

    buildCollectionChart();

    buildPieChart();

}

function buildCollectionChart() {

    const ctx = document
        .getElementById("collectionChart")
        .getContext("2d");

    if (collectionChart)
        collectionChart.destroy();

    const months = [...new Set(
        transactions
            .map(t => monthKey(t.date))
    )].sort();

    const credit = [];

    months.forEach(month => {

        let total = 0;

        transactions.forEach(t => {

            if (
                monthKey(t.date) === month &&
                String(t.type).toLowerCase() === "credit"
            ) {
                total += Number(t.amount) || 0;
            }

        });

        credit.push(total);

    });

    collectionChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: months.map(monthLabel),

            datasets: [

                {

                    label: "Collection",

                    data: credit,

                    backgroundColor: "#10b981",

                    borderRadius: 8

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            }

        }

    });

}

/* ==========================================================
   PIE CHART
========================================================== */

function buildPieChart() {

    const ctx = document
        .getElementById("pieChart")
        .getContext("2d");

    if (pieChart)
        pieChart.destroy();

    let credit = 0;
    let debit = 0;

    transactions.forEach(t => {

        if (String(t.type).toLowerCase() === "credit")
            credit += Number(t.amount) || 0;

        if (String(t.type).toLowerCase() === "debit")
            debit += Number(t.amount) || 0;

    });

    pieChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: [

                "Credit",

                "Debit"

            ],

            datasets: [

                {

                    data: [

                        credit,

                        debit

                    ],

                    backgroundColor: [

                        "#16a34a",

                        "#dc2626"

                    ]

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}

/* ==========================================================
   OVERRIDE updateDashboard
========================================================== */

const oldUpdateDashboard = updateDashboard;

updateDashboard = function () {

    oldUpdateDashboard();

    buildCharts();

};

/* ==========================================================
   DARK MODE
========================================================== */

const darkButton =
document.getElementById("darkModeBtn");

if (darkButton) {

    darkButton.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        localStorage.setItem(

            "dark",

            document.body.classList.contains("dark")

        );

    });

}

if (localStorage.getItem("dark") === "true") {

    document.body.classList.add("dark");

}

/* ==========================================================
   AUTO REFRESH
========================================================== */

setInterval(() => {

    console.log("Refreshing...");

    loadData();

}, 300000);

/* ==========================================================
   WINDOW RESIZE
========================================================== */

window.addEventListener("resize", () => {

    if (collectionChart)
        collectionChart.resize();

    if (pieChart)
        pieChart.resize();

});

/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadData();

});

/* ==========================================================
   DEBUG
========================================================== */

window.dashboard = {

    data: () => apiData,

    transactions: () => transactions,

    staff: () => staff,

    selectedStaff: () => [...selectedStaff],

    month: () => selectedMonth

};

console.log("Staff Club Fund Dashboard Ready");
