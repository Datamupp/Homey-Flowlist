/*
Prints all flows and folders grouped and sorted to the console.
The list use tabs to line up the folder hierarchy.
You can select the printed text, copy it to the keyboard and paste in your
favourite texteditor or excel.  In excel, use "Paste special" otherwise the tabs won't
be interpreted as next column.

They say that when you look at your own code 6 months from now it's like looking at a 
strangers code.  This code won't even last a week.  I'm pretty new to both Javascript and
Homey API so show mercy ;)

Håkan Bergström
https://github.com/Datamupp
*/

var flowDictName = {};
var flowDictFolder = {};
var flowDictEnabled = {};

var folderDictName = {};
var folderDictParent = {};
var folderDictIndexOffset = {};

var folderCount = 0;
var flowCount = 0;

var itemOrder = [];
var itemIndex = [];
var itemType = [];

let allFolders = await Homey.flow.getFlowFolders();
let allFlows = await Homey.flow.getFlows();

allFolders = _.sortBy(allFolders, o => o.name.toLowerCase());
allFlows = _.sortBy(allFlows, o => o.name.toLowerCase());

//Create a list of all folders with their ID and NAME / ID and Parentfolder ID for easier access later
_.forEach(allFolders, currentFolder => {
    folderDictName[currentFolder.id] = currentFolder.name;
    folderDictParent[currentFolder.id] = currentFolder.parent;
    folderDictIndexOffset[currentFolder.id] = 1;
    folderCount++;
})

//Create a list of all flows with their ID and NAME for easier access later
_.forEach(allFlows, currentFlow => {
    flowDictName[currentFlow.id] = currentFlow.name;
    flowDictFolder[currentFlow.id] = currentFlow.folder;
    flowDictEnabled[currentFlow.id] = currentFlow.enabled;
    flowCount++;
})

//Append all rootfolders to folderOrder
_.forEach(allFolders, currentFolder => {
    if (currentFolder.parent == null) {
        itemOrder.push(currentFolder.id);
        itemIndex.push(0);
        itemType.push("Folder");
    }
})

var itemInserted;
var i;
var i2; 

do {
    itemInserted=false;
    _.forEach(allFolders, currentFolder => {
        for (i=0;i<itemOrder.length;i++) {
            if (currentFolder.parent == itemOrder[i]) {
                if (itemOrder.indexOf(currentFolder.id)==-1) {
                    itemOrder.splice(i+folderDictIndexOffset[currentFolder.parent],0,currentFolder.id);
                    itemIndex.splice(i+folderDictIndexOffset[currentFolder.parent],0,itemIndex[i]+1);
                    itemType.splice(i+folderDictIndexOffset[currentFolder.parent],0,"Folder");
                    folderDictIndexOffset[currentFolder.parent]++;
                    itemInserted=true;
                    break;
                }
            }
        }
    })
}
while (itemInserted==true);

//All folders are now added to the itemOrder array, time to insert flows that has a parent folder
var x;
do {
    itemInserted=false;
    for (i=0;i<itemOrder.length;i++) {
        if (itemType[i]=='Folder') {
            for (x in flowDictFolder) { //The Flow ID
                if (flowDictFolder[x]==itemOrder[i]) { //ID of the flows folder == current folder
                    if (itemOrder.indexOf(x)==-1) { //The flow isn't already added
                        itemOrder.splice(i+folderDictIndexOffset[itemOrder[i]],0,x);
                        itemIndex.splice(i+folderDictIndexOffset[itemOrder[i]],0,itemIndex[i]+1);
                        itemType.splice(i+folderDictIndexOffset[itemOrder[i]],0,"Flow");
                        folderDictIndexOffset[itemOrder[i]]++;
                        itemInserted=true;
                    }
                }
            }
        }
    }
}
while (itemInserted==true);

//Add the remaining flows that has no parent folder
i=itemOrder.length;
for (x in flowDictFolder) { //The Flow ID
    if (flowDictFolder[x]==undefined) { //ID of the flows folder == current folder
            itemOrder.splice(i,0,x);
            itemIndex.splice(i,0,itemIndex[i]+1);
            itemType.splice(i,0,"Flow");
            i++;
    }
}

//All folders and flows are now added to itemOrder[] in alphabetical order, but I want
//them grouped. Folders first, flows second
var itemsSwitched;
do {
    itemsSwitched=false;
    for (i=0;i<itemOrder.length;i++) {
        if (itemIndex[i]<=itemIndex[i+1] && itemType[i]=='Flow' && itemType[i+1]=='Folder') {                
            itemOrder.splice(i+1,1,itemOrder.splice(i,1,itemOrder[i+1]));
            itemIndex.splice(i+1,1,itemIndex.splice(i,1,itemIndex[i+1]));
            itemType.splice(i+1,1,itemType.splice(i,1,itemType[i+1]));                
            itemsSwitched=true;
        }
        else if (itemIndex[i]<itemIndex[i+1] && itemType[i]=='Flow' && itemType[i+1]=='Flow') {
            itemOrder.splice(i+1,1,itemOrder.splice(i,1,itemOrder[i+1]));
            itemIndex.splice(i+1,1,itemIndex.splice(i,1,itemIndex[i+1]));
            itemType.splice(i+1,1,itemType.splice(i,1,itemType[i+1]));                 
            itemsSwitched=true;
        }
    }
}
while (itemsSwitched==true);

//Print to console
var rowText = "";
console.log('NOTE!  The different platforms of Homey handles spaces differently, which could make the list look unsorted\nif you use more than one platform. On the webeditor of flow.homey.app normal spaces is used, but in the iOS-app\nthey use non-breakable spaces. And for a computer this is not treated as the same.\nSimply edit the name and save it from your most used platform.\n\n');
for (i=0;i<itemOrder.length;i++) {
    rowText=String.fromCharCode(9).repeat(itemIndex[i])
    if (itemType[i]=='Folder') {
        rowText+=folderDictName[itemOrder[i]] + ' /';
    }
    else
    {
        rowText+=flowDictName[itemOrder[i]];
        if (flowDictEnabled[itemOrder[i]]==false) {
            rowText+=String.fromCharCode(9) + '(disabled)';
        }
    }
    console.log(rowText);
}

return true;