pieChart = new Chart(ctx, {

type:"pie",

data:data,

options:{

responsive:true,

maintainAspectRatio:true,

aspectRatio:1,

plugins:{

legend:{

position:"bottom"

}

}

}

});
