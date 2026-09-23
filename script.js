"use strict";

/* ================================
   REFERRAL HUB
   Internship Referral Management
================================ */

const STORAGE_KEY = "referralHubCandidates";
const GFORM_URL = "https://forms.gle/wHahV1hWZsBiKUCA6";

let candidates = [];
let editingId = null;


/* ================================
   DOM
================================ */

const preloader = document.getElementById("preloader");
const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");

const pageTitle = document.getElementById("pageTitle");

const candidateForm = document.getElementById("candidateForm");
const modalForm = document.getElementById("modalForm");

const candidateModal = document.getElementById("candidateModal");

const candidateTableBody =
    document.getElementById("candidateTableBody");

const recentList =
    document.getElementById("recentList");

const searchInput =
    document.getElementById("searchInput");

const domainFilter =
    document.getElementById("domainFilter");

const statusFilter =
    document.getElementById("statusFilter");


/* ================================
   INITIALIZE
================================ */

document.addEventListener("DOMContentLoaded", () => {

    loadCandidates();

    setupNavigation();
    setupForms();
    setupButtons();
    setupTheme();

    updateAll();

    setTimeout(() => {
        preloader.style.opacity = "0";

        setTimeout(() => {
            preloader.style.display = "none";
        }, 400);

    }, 500);

});


/* ================================
   STORAGE
================================ */

function loadCandidates() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        candidates = saved
            ? JSON.parse(saved)
            : [];

        if (!Array.isArray(candidates)) {
            candidates = [];
        }

    } catch (error) {

        console.error("Storage error:", error);
        candidates = [];

    }
}


function saveCandidates() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(candidates)
    );
}


/* ================================
   NAVIGATION
================================ */

function setupNavigation() {

    document.querySelectorAll(".nav-item").forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.dataset.section;

            showSection(section);

            sidebar.classList.remove("open");

        });

    });


    document.querySelectorAll("[data-go]").forEach(button => {

        button.addEventListener("click", () => {

            showSection(button.dataset.go);

        });

    });


    mobileMenu.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}


function showSection(sectionId) {

    document.querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    const section =
        document.getElementById(sectionId);

    if (!section) return;

    section.classList.add("active");

    document.querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section === sectionId
            );

        });


    const titles = {
        dashboard: "Dashboard",
        referrals: "Refer Candidate",
        candidates: "Candidates",
        analytics: "Analytics",
        about: "About Task"
    };

    pageTitle.textContent =
        titles[sectionId] || "ReferralHub";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (sectionId === "analytics") {
        renderAnalytics();
    }

}


/* ================================
   FORM SETUP
================================ */

function setupForms() {

    candidateForm.addEventListener(
        "submit",
        handleMainForm
    );

    modalForm.addEventListener(
        "submit",
        handleModalForm
    );


    document
        .getElementById("clearForm")
        .addEventListener("click", clearMainForm);


    document
        .getElementById("modalClose")
        .addEventListener("click", closeModal);


    document
        .getElementById("modalCancel")
        .addEventListener("click", closeModal);


    candidateModal.addEventListener("click", event => {

        if (event.target === candidateModal) {
            closeModal();
        }

    });


    searchInput.addEventListener(
        "input",
        renderCandidates
    );

    domainFilter.addEventListener(
        "change",
        renderCandidates
    );

    statusFilter.addEventListener(
        "change",
        renderCandidates
    );


    document
        .getElementById("resetFilters")
        .addEventListener("click", () => {

            searchInput.value = "";
            domainFilter.value = "";
            statusFilter.value = "";

            renderCandidates();

        });

}


/* ================================
   BUTTONS
================================ */

function setupButtons() {

    document
        .getElementById("welcomeAddBtn")
        .addEventListener("click", () => {
            showSection("referrals");
        });


    document
        .getElementById("quickAdd")
        .addEventListener("click", () => {
            showSection("referrals");
        });


    document
        .getElementById("candidateAddBtn")
        .addEventListener("click", openAddModal);


    document
        .getElementById("quickExport")
        .addEventListener("click", exportCSV);


    document
        .getElementById("quickForm")
        .addEventListener("click", openGForm);


    document
        .getElementById("sidebarGForm")
        .addEventListener("click", openGForm);


    document
        .getElementById("requirementFormBtn")
        .addEventListener("click", openGForm);


    document
        .getElementById("aboutFormBtn")
        .addEventListener("click", openGForm);

}


/* ================================
   MAIN FORM
================================ */

function handleMainForm(event) {

    event.preventDefault();

    const name =
        document.getElementById("candidateName").value.trim();

    const email =
        document.getElementById("candidateEmail").value.trim();

    const phone =
        document.getElementById("candidatePhone").value.trim();

    const domain =
        document.getElementById("candidateDomain").value;

    const status =
        document.getElementById("candidateStatus").value;

    const note =
        document.getElementById("candidateNote").value.trim();


    if (!validateCandidate(name, email, phone, domain)) {
        return;
    }


    if (emailExists(email)) {

        showToast(
            "Duplicate Email",
            "This email is already registered.",
            "!"
        );

        return;
    }


    const candidate = {

        id: generateId(),

        name,
        email,
        phone,
        domain,
        status,

        note,

        date: new Date().toISOString()

    };


    candidates.unshift(candidate);

    saveCandidates();

    updateAll();

    clearMainForm();

    showToast(
        "Candidate Added",
        `${name} was successfully added.`,
        "✓"
    );

}


/* ================================
   MODAL FORM
================================ */

function handleModalForm(event) {

    event.preventDefault();

    const name =
        document.getElementById("modalName").value.trim();

    const email =
        document.getElementById("modalEmail").value.trim();

    const phone =
        document.getElementById("modalPhone").value.trim();

    const domain =
        document.getElementById("modalDomain").value;

    const status =
        document.getElementById("modalStatus").value;


    if (!validateCandidate(name, email, phone, domain)) {
        return;
    }


    if (emailExists(email, editingId)) {

        showToast(
            "Duplicate Email",
            "Another candidate uses this email.",
            "!"
        );

        return;
    }


    if (editingId) {

        const index =
            candidates.findIndex(
                item => item.id === editingId
            );

        if (index !== -1) {

            candidates[index] = {
                ...candidates[index],
                name,
                email,
                phone,
                domain,
                status
            };

            saveCandidates();
            updateAll();

            showToast(
                "Candidate Updated",
                `${name} details were updated.`,
                "✓"
            );

        }

    } else {

        candidates.unshift({

            id: generateId(),

            name,
            email,
            phone,
            domain,
            status,

            note: "",

            date: new Date().toISOString()

        });

        saveCandidates();
        updateAll();

        showToast(
            "Candidate Added",
            `${name} was added successfully.`,
            "✓"
        );

    }


    closeModal();

}


/* ================================
   VALIDATION
================================ */

function validateCandidate(
    name,
    email,
    phone,
    domain
) {

    if (!name || name.length < 2) {

        showToast(
            "Invalid Name",
            "Please enter a valid candidate name.",
            "!"
        );

        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        showToast(
            "Invalid Email",
            "Please enter a valid email address.",
            "!"
        );

        return false;
    }


    if (!/^\d{10}$/.test(phone)) {

        showToast(
            "Invalid Phone",
            "Phone number must contain 10 digits.",
            "!"
        );

        return false;
    }


    if (!domain) {

        showToast(
            "Select Domain",
            "Please select an internship domain.",
            "!"
        );

        return false;
    }


    return true;
}


function emailExists(email, ignoreId = null) {

    return candidates.some(candidate =>
        candidate.email.toLowerCase() === email.toLowerCase()
        && candidate.id !== ignoreId
    );

}


/* ================================
   MODAL
================================ */

function openAddModal() {

    editingId = null;

    document.getElementById("modalTitle")
        .textContent = "Add Candidate";

    modalForm.reset();

    candidateModal.classList.add("show");

    setTimeout(() => {
        document.getElementById("modalName").focus();
    }, 100);

}


function editCandidate(id) {

    const candidate =
        candidates.find(item => item.id === id);

    if (!candidate) return;

    editingId = id;

    document.getElementById("modalTitle")
        .textContent = "Edit Candidate";

    document.getElementById("modalName").value =
        candidate.name;

    document.getElementById("modalEmail").value =
        candidate.email;

    document.getElementById("modalPhone").value =
        candidate.phone;

    document.getElementById("modalDomain").value =
        candidate.domain;

    document.getElementById("modalStatus").value =
        candidate.status;

    candidateModal.classList.add("show");

}


function closeModal() {

    candidateModal.classList.remove("show");

    editingId = null;

    modalForm.reset();

}


/* ================================
   DELETE
================================ */

function deleteCandidate(id) {

    const candidate =
        candidates.find(item => item.id === id);

    if (!candidate) return;

    const confirmDelete =
        confirm(
            `Delete referral for ${candidate.name}?`
        );

    if (!confirmDelete) return;

    candidates =
        candidates.filter(
            item => item.id !== id
        );

    saveCandidates();

    updateAll();

    showToast(
        "Candidate Deleted",
        `${candidate.name} was removed.`,
        "✓"
    );

}


/* ================================
   RENDER TABLE
================================ */

function renderCandidates() {

    const search =
        searchInput.value.toLowerCase().trim();

    const domain =
        domainFilter.value;

    const status =
        statusFilter.value;


    const filtered =
        candidates.filter(candidate => {

            const matchesSearch =
                candidate.name.toLowerCase().includes(search) ||
                candidate.email.toLowerCase().includes(search);

            const matchesDomain =
                !domain ||
                candidate.domain === domain;

            const matchesStatus =
                !status ||
                candidate.status === status;

            return (
                matchesSearch &&
                matchesDomain &&
                matchesStatus
            );

        });


    if (!filtered.length) {

        candidateTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div>🔎</div>
                        <h4>No candidates found</h4>
                        <p>Try changing your search or filters.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    candidateTableBody.innerHTML =
        filtered.map(candidate => {

            const initials =
                getInitials(candidate.name);

            return `
                <tr>

                    <td>
                        <div class="candidate-main">
                            <div class="avatar">
                                ${initials}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(candidate.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(candidate.email)}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td>
                        ${escapeHTML(candidate.domain)}
                    </td>

                    <td>
                        <span class="status-badge ${getStatusClass(candidate.status)}">
                            ${escapeHTML(candidate.status)}
                        </span>
                    </td>

                    <td>
                        ${formatDate(candidate.date)}
                    </td>

                    <td>
                        <div class="table-actions">

                            <button
                                class="table-action"
                                title="Edit"
                                onclick="editCandidate('${candidate.id}')"
                            >
                                ✎
                            </button>

                            <button
                                class="table-action delete"
                                title="Delete"
                                onclick="deleteCandidate('${candidate.id}')"
                            >
                                🗑
                            </button>

                        </div>
                    </td>

                </tr>
            `;

        }).join("");

}


/* ================================
   RECENT
================================ */

function renderRecent() {

    const recent =
        candidates.slice(0, 5);

    if (!recent.length) {

        recentList.innerHTML = `
            <div class="empty-state">
                <div>👥</div>
                <h4>No referrals yet</h4>
                <p>Add your first candidate to get started.</p>
            </div>
        `;

        return;
    }


    recentList.innerHTML =
        recent.map(candidate => {

            return `
                <div class="recent-item">

                    <div class="candidate-main">

                        <div class="avatar">
                            ${getInitials(candidate.name)}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(candidate.name)}
                            </strong>

                            <small>
                                ${escapeHTML(candidate.domain)}
                                · ${formatDate(candidate.date)}
                            </small>
                        </div>

                    </div>

                    <span class="status-badge ${getStatusClass(candidate.status)}">
                        ${escapeHTML(candidate.status)}
                    </span>

                </div>
            `;

        }).join("");

}


/* ================================
   STATISTICS
================================ */

function updateStatistics() {

    const total =
        candidates.length;

    const active =
        candidates.filter(
            candidate => candidate.status === "Active"
        ).length;

    const domains =
        new Set(
            candidates.map(candidate => candidate.domain)
        ).size;

    const percentage =
        Math.min(
            Math.round((active / 5) * 100),
            100
        );


    document.getElementById(
        "totalCandidates"
    ).textContent = total;


    document.getElementById(
        "activeCandidates"
    ).textContent = active;


    document.getElementById(
        "domainCount"
    ).textContent = domains;


    document.getElementById(
        "completionPercent"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "progressNumber"
    ).textContent =
        active;


    document.getElementById(
        "progressPercent"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "progressFill"
    ).style.width =
        percentage + "%";


    const message =
        document.getElementById("progressMessage");


    if (active >= 5) {

        message.textContent =
            "🎉 Minimum referral target completed!";

    } else {

        const remaining =
            5 - active;

        message.textContent =
            `${remaining} more active candidate${remaining === 1 ? "" : "s"} needed.`;

    }

}


/* ================================
   ANALYTICS
================================ */

function renderAnalytics() {

    renderDomainChart();
    renderStatusChart();

}


function renderDomainChart() {

    const chart =
        document.getElementById("domainChart");

    if (!candidates.length) {

        chart.innerHTML = `
            <div class="empty-state">
                <div>📊</div>
                <h4>No analytics data</h4>
                <p>Add candidates to see domain distribution.</p>
            </div>
        `;

        return;
    }


    const domainCounts = {};

    candidates.forEach(candidate => {

        domainCounts[candidate.domain] =
            (domainCounts[candidate.domain] || 0) + 1;

    });


    const max =
        Math.max(...Object.values(domainCounts));


    chart.innerHTML =
        Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([domain, count]) => {

                const percentage =
                    (count / max) * 100;

                return `
                    <div class="bar-item">

                        <div class="bar-label">
                            <span>${escapeHTML(domain)}</span>
                            <span>${count}</span>
                        </div>

                        <div class="bar-track">
                            <div
                                class="bar-value"
                                style="width:${percentage}%"
                            ></div>
                        </div>

                    </div>
                `;

            }).join("");

}


function renderStatusChart() {

    const chart =
        document.getElementById("statusChart");

    const statuses = [
        "Active",
        "Interested",
        "Contacted",
        "Pending"
    ];


    chart.innerHTML =
        statuses.map(status => {

            const count =
                candidates.filter(
                    candidate => candidate.status === status
                ).length;

            return `
                <div class="status-box">
                    <strong>${count}</strong>
                    <span>${status}</span>
                </div>
            `;

        }).join("");

}


/* ================================
   CSV EXPORT
================================ */

function exportCSV() {

    if (!candidates.length) {

        showToast(
            "No Data",
            "Add at least one candidate before exporting.",
            "!"
        );

        return;
    }


    const headers = [
        "Candidate Name",
        "Email",
        "Phone",
        "Domain",
        "Status",
        "Notes",
        "Date Added"
    ];


    const rows =
        candidates.map(candidate => [

            candidate.name,
            candidate.email,
            candidate.phone,
            candidate.domain,
            candidate.status,
            candidate.note || "",
            formatDate(candidate.date)

        ]);


    const csv = [
        headers,
        ...rows
    ]
    .map(row =>
        row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    )
    .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `ReferralHub_Candidates_${new Date().toISOString().slice(0,10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);


    showToast(
        "CSV Exported",
        "Candidate data downloaded successfully.",
        "✓"
    );

}


/* ================================
   THEME
================================ */

function setupTheme() {

    const toggle =
        document.getElementById("themeToggle");


    const savedTheme =
        localStorage.getItem("referralHubTheme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        toggle.textContent = "☀️";

    }


    toggle.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");


        toggle.textContent =
            dark ? "☀️" : "🌙";


        localStorage.setItem(
            "referralHubTheme",
            dark ? "dark" : "light"
        );

    });

}


/* ================================
   G-FORM
================================ */

function openGForm() {

    window.open(
        GFORM_URL,
        "_blank",
        "noopener,noreferrer"
    );

}


/* ================================
   MAIN FORM CLEAR
================================ */

function clearMainForm() {

    candidateForm.reset();

}


/* ================================
   TOAST
================================ */

let toastTimer;

function showToast(
    title,
    message,
    icon = "✓"
) {

    const toast =
        document.getElementById("toast");

    document.getElementById(
        "toastTitle"
    ).textContent = title;

    document.getElementById(
        "toastMessage"
    ).textContent = message;

    document.getElementById(
        "toastIcon"
    ).textContent = icon;


    toast.classList.add("show");


    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

}


/* ================================
   HELPERS
================================ */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );

}


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");

}


function getStatusClass(status) {

    const classes = {

        Active: "status-active",

        Interested: "status-interested",

        Contacted: "status-contacted",

        Pending: "status-pending"

    };

    return classes[status] || "status-pending";

}


function formatDate(date) {

    const parsed =
        new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ================================
   UPDATE EVERYTHING
================================ */

function updateAll() {

    updateStatistics();

    renderCandidates();

    renderRecent();

    renderAnalytics();

}


/* ================================
   GLOBAL FUNCTIONS
================================ */

window.editCandidate = editCandidate;
window.deleteCandidate = deleteCandidate;