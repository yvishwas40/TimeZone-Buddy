const { DateTime, Interval } = luxon;
const participants = [];
const API_KEY = '9697fab1640740a69805687edcb7c01f'; // 🔑 Replace this

async function getTimeZone(city) {
  const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}`);
  const data = await response.json();

  if (data && data.results && data.results.length > 0) {
    const result = data.results[0];
    const timezone = result.annotations.timezone.name;
    return timezone; // e.g. "America/New_York"
  } else {
    throw new Error("City not found.");
  }
}

async function addParticipant() {
  const city = document.getElementById("cityInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!city) return;

  try {
    const timezone = await getTimeZone(city);
    participants.push({ city, timezone });
    document.getElementById("participants").innerHTML += `<div>✅ ${city} (${timezone})</div>`;
    document.getElementById("cityInput").value = '';
    resultDiv.innerHTML = '';
  } catch (error) {
    resultDiv.innerHTML = `❌ Error: ${error.message}`;
  }
}

function getAvailabilityRange(timezone) {
  const start = DateTime.fromObject({ hour: 9 }, { zone: timezone }).toUTC();
  const end = DateTime.fromObject({ hour: 20 }, { zone: timezone }).toUTC();
  return Interval.fromDateTimes(start, end);
}

function findMeetingTime() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  if (participants.length < 2) {
    resultDiv.innerHTML = "⚠️ Please add at least two participants.";
    return;
  }

  const intervals = participants.map(p => getAvailabilityRange(p.timezone));
  let overlap = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    overlap = overlap.intersection(intervals[i]);
    if (!overlap) break;
  }

  if (!overlap) {
    resultDiv.innerHTML = "❌ No overlapping time window found.";
    return;
  }

  const startUTC = overlap.start;
  const endUTC = overlap.end;

  resultDiv.innerHTML += `<strong>✅ Overlapping Time (UTC):</strong> ${startUTC.toFormat('HH:mm')} - ${endUTC.toFormat('HH:mm')}<br/><br/>`;
  resultDiv.innerHTML += `<strong>🕓 Suggested Meeting Time in Local Time:</strong><br/>`;

  participants.forEach(p => {
    const localTime = startUTC.setZone(p.timezone);
    resultDiv.innerHTML += `🕒 ${p.city} – ${localTime.toFormat('hh:mm a')}<br/>`;
  });
}
