const fileColumns = document.getElementById("fileColumns");

// Buat 20 kolom file input
for (let i = 1; i <= 20; i++) {
  const box = document.createElement("div");
  box.className = "file-box";

  const filename = document.createElement("input");
  filename.placeholder = `Nama file untuk kolom ${i}`;
  filename.className = "file-name";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Isi nomor (satu per baris)";

  const button = document.createElement("button");
  button.textContent = "Download .vcf";
  button.addEventListener("click", () => {
    generateVCF(filename.value.trim(), textarea.value.trim());
  });

  box.appendChild(filename);
  box.appendChild(textarea);
  box.appendChild(button);
  fileColumns.appendChild(box);
}

// ===============================
// FUNGSI LEADING ZERO
// ===============================
function formatNum(num, total, useZero) {
  if (!useZero) return num;  
  return total >= 10 ? num.toString().padStart(2, "0") : num.toString();
}

function generateVCF(fileName, rawText) {
  const namaAdmin = document.getElementById("namaAdmin").value.trim();
  const namaNavy = document.getElementById("namaNavy").value.trim();
  const awal = document.getElementById("pilihanAwal").value;
  const urutan = document.getElementById("urutan").value;
  const jumlahAwal = parseInt(document.getElementById("jumlahAwal").value) || 1;

  const useLeadingZero = document.getElementById("leadingZero").checked;

  const tambahanAdmin = document.getElementById("extraAdmin").value.trim().split('\n').filter(Boolean);
  const tambahanNavy = document.getElementById("extraNavy").value.trim().split('\n').filter(Boolean);

  let numbers = rawText
    .split('\n')
    .map(n => n.replace(/[^\d+]/g, ''))
    .map(n => n.startsWith('+') ? n : '+' + n)
    .filter(n => /^(\+\d{10,})$/.test(n));

  if (urutan === "bawah") numbers = numbers.reverse();

  let adminList = [];
  let navyList = [];
  let extraAdminList = [];
  let extraNavyList = [];

  let adminCount = 0;
  let navyCount = 0;
  const isAdmin = awal === "admin";

  // ======== ADMIN & NAVY UTAMA ========
  numbers.forEach((num, index) => {
    let labelNum;
    if ((isAdmin && index < jumlahAwal) || (!isAdmin && index >= jumlahAwal)) {
      adminCount++;
      labelNum = formatNum(adminCount, null, false); // sementara
      adminList.push({ rawIndex: adminCount, phone: num });
    } else {
      navyCount++;
      labelNum = formatNum(navyCount, null, false);
      navyList.push({ rawIndex: navyCount, phone: num });
    }
  });

  // ======== TAMBAHAN ADMIN ========
  tambahanAdmin.forEach(n => {
    const nomorFix = (n.startsWith('+') ? n : '+' + n).replace(/[^\d+]/g, '');
    if (/^(\+\d{10,})$/.test(nomorFix)) {
      adminCount++;
      extraAdminList.push({ rawIndex: adminCount, phone: nomorFix });
    }
  });

  // ======== TAMBAHAN NAVY ========
  tambahanNavy.forEach(n => {
    const nomorFix = (n.startsWith('+') ? n : '+' + n).replace(/[^\d+]/g, '');
    if (/^(\+\d{10,})$/.test(nomorFix)) {
      navyCount++;
      extraNavyList.push({ rawIndex: navyCount, phone: nomorFix });
    }
  });

  // HITUNG TOTAL PER GRUP
  const totalAdmin = adminCount;
  const totalNavy = navyCount;

  // APPLY LEADING ZERO
  function buildName(base, fname, rawIdx, total) {
    const finalNum = useLeadingZero
      ? formatNum(rawIdx, total, true)
      : rawIdx.toString();

    return fname
      ? `${base} ${fname} ${finalNum}`
      : `${base} ${finalNum}`;
  }

  const finalAdmin = [...adminList, ...extraAdminList].map(d => ({
    name: buildName(namaAdmin, fileName, d.rawIndex, totalAdmin),
    phone: d.phone
  }));

  const finalNavy = [...navyList, ...extraNavyList].map(d => ({
    name: buildName(namaNavy, fileName, d.rawIndex, totalNavy),
    phone: d.phone
  }));

  const contacts = [...finalAdmin, ...finalNavy];

  // ======== BUAT FILE VCF ========
  let vcfContent = contacts
    .map(c => `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=CELL:${c.phone}\nEND:VCARD`)
    .join('\n');

  const blob = new Blob([vcfContent], { type: "text/vcard" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ADMIN NAVY ${fileName || 'contacts'}.vcf`;
  a.click();
}

// Fungsi isi otomatis
function isiOtomatis() {
  const rangeInput = document.getElementById("rangeNomor").value.trim();
  const perBagian = parseInt(document.getElementById("perBagian").value.trim());

  if (!/^(\d+)-(\d+)$/.test(rangeInput) || isNaN(perBagian) || perBagian <= 0) {
    alert("Isi format rentang dengan benar, contoh: 123-152 dan bagi per berapa.");
    return;
  }

  const [mulai, akhir] = rangeInput.split('-').map(Number);
  const total = akhir - mulai + 1;
  const fileInputs = document.querySelectorAll(".file-name");

  let counter = 0;
  for (let i = 0; i < total; i += perBagian) {
    const from = mulai + i;
    const to = Math.min(mulai + i + perBagian - 1, akhir);
    if (fileInputs[counter]) {
      fileInputs[counter].value = `${from}-${to}`;
      counter++;
    } else {
      break;
    }
  }
}

// Fungsi hapus otomatis
function hapusOtomatis() {
  const fileInputs = document.querySelectorAll(".file-name");
  fileInputs.forEach(input => input.value = "");
}
