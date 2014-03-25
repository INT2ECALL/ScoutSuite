var violations_array = new Array();

// Generic load JSON function
function load_aws_config_from_json(list, keyword, cols) {
    var id1 = '#' + keyword + '-list-template';
    var id2 = keyword + 's-list';
    var tmp = Handlebars.compile($(id1).html());
    document.getElementById(id2).innerHTML = tmp({items: list});
    if (cols >= 2) {
        var id3 = '#' + keyword + '-detail-template';
        var id4 = keyword + 's-details';
        var tmp = Handlebars.compile($(id3).html());
        document.getElementById(id4).innerHTML = tmp({items: list});
    }
}

// Generic highlight finding function
function highlight_violations(violations, keyword) {
    for (i in violations) {
        var vkey = violations[i]['keyword_prefix'] + '_' + violations[i]['entity'].split('.').pop() + '-' + i;
        violations_array[vkey] = new Array();
        for (j in violations[i]['items']) {
            var id = vkey + '-' + violations[i]['items'][j];
            var style = "finding-" + violations[i]['level'];
            $('[id$="' + id + '"]').addClass(style);
            violations_array[vkey].push(violations[i]['macro_items'][j]);
        }
    }
    load_aws_config_from_json(violations, keyword + '_violation', 1);
}

// Display functions
function hideAll() {
    $("[id$='-row']").hide();
    $("[id*='-details-']").hide();
}
function hideRowItems(keyword) {
    $("[id*='" + keyword + "-list']").hide();
    $("[id*='" + keyword + "-details']").hide();
}
function showEmptyRow(keyword) {
    id = "#" + keyword + "s-row";
    $(id).show();
    hideRowItems(keyword);
}
function showItem(keyword, id) {
    var id1 = '[id="' + keyword + '-list-' + id + '"]';
    var id2 = '[id="' + keyword + '-details-' + id+ '"]';
    $(id1).show();
    $(id2).show();
}
function showRow(keyword) {
    id = "#" + keyword + "s-row";
    $(id).show();
}
function showRowWithDetails(keyword) {
    showRow(keyword);
    showAll(keyword);
}
function showAll(keyword) {
    $("[id*='" + keyword + "-list']").show();
    $("[id*='" + keyword + "-details']").show();
}
function toggleDetails(keyword, item) {
    var id = '#' + keyword + '-' + item;
    $(id).toggle();
}
function updateNavbar(active) {
    prefix = active.split('_')[0];
    $('[id*="_dropdown"]').removeClass('active-dropdown');
    $('#' + prefix + '_dropdown').addClass('active-dropdown');
}
function toggleVisibility(id) {
    id1 = '#' + id;
    $(id1).toggle()
    id2 = '#bullet-' + id;
    if ($(id1).is(":visible")) {
        $(id2).html('<i class="glyphicon glyphicon-collapse-down"></i>');
    } else {
        $(id2).html('<i class="glyphicon glyphicon-expand"></i>');
    }
}
function showEC2InstanceDetails(keyword, region, vpc, id) {
    var data = ec2_info['regions'][region]['vpcs'][vpc]['instances'][id];
    $('#overlay-details').html(single_ec2_instance_template(data));
    $("#overlay-background").show();
    $("#overlay-details").show();
}
function hidePopup() {
    $("#overlay-background").hide();
    $("#overlay-details").hide();
}

// Browsing functions
function about() {
    hideAll();
    $('#about-row').show();
}
function browseTo(keyword, id) {
    hideAll();
    showRow(keyword);
    var html_id = "[id=\"" + keyword + "-details-" + id + "\"]";
    $(html_id).show();
    window.scrollTo(0,0);
}
function list_generic(keyword) {
    updateNavbar(keyword);
    hideAll();
    showRowWithDetails(keyword);
    window.scrollTo(0,0);
}
function list_findings(keyword, violations, finding) {
    updateNavbar(keyword);
    hideAll();
    showEmptyRow(keyword);
    for (item in  violations[finding]['macro_items']) {
        showItem(keyword, violations[finding]['macro_items'][item]);
    }
    window.scrollTo(0,0);
}

// Handlebars helpers
Handlebars.registerHelper("decodeURIComponent", function(blob) {
    var test = decodeURIComponent(blob);
    test = test.replace(/ /g, '&nbsp;');
    test = test.replace(/\n/g, '<br />');
    return test;
});
Handlebars.registerHelper("has_profiles?", function(logins) {
    if(typeof logins != 'undefined' && logins != '') {
        return 'Yes';
    } else {
        return 'No';
    }
});
Handlebars.registerHelper('has_access_keys?', function(access_keys) {
    if (typeof access_keys != 'undefined' && access_keys != '') {
        return access_keys.length;
    } else {
        return 0;
    }
});
Handlebars.registerHelper('has_mfa?', function(mfa_devices) {
    if (typeof mfa_devices != 'undefined' && mfa_devices != '') {
        return 'Yes';
    } else {
        return 'No';
    }
});
Handlebars.registerHelper('format_grant', function(grants) {
    if (grants.match(/.*\(.*\)/)) {
        return 'EC2 Group: ';
    } else {
        return 'Source IP: ';
    }
});
Handlebars.registerHelper('list_permissions', function(permissions) {
    var r = '';
    if (typeof permissions != 'undefined' && permissions != '') {
        r += parse_entities('group', permissions.groups);
        r += parse_entities('role', permissions.roles);
        r += parse_entities('user', permissions.users);
    }
    return r;
});
var gc = {}; gc['group'] = 0; gc['role'] = 0; gc['user'] = 0;
function parse_entities(keyword, permissions) {
    var p = '';
    var r = '';
    for (i in permissions) {
        p += format_entity(keyword, permissions[i].name, permissions[i].policy_name, gc[keyword]++);
    }
    if (p != '') {
        r = '<p>' + keyword.charAt(0).toUpperCase() + keyword.slice(1) + 's:</p><ul>' + p + '</ul>';
    }
    return r;
}
function format_entity(keyword, name, policy_name, c) {
    var r = '';
    r += "<li>" + name + " [<a href=\"javascript:toggleDetails('" + keyword + "'," + c + ")\">Details</a>]";
    r += "<div class=\"row\" style=\"display:none\" id=\"" + keyword + "-" + c + "\">" + policy_name + "</div></li>";
    return r;
}
Handlebars.registerHelper('s3_grant_2_icon', function(value) {
    return '<i class="' + ((value == true) ? 'glyphicon glyphicon-ok' : '') +'"></i>';
});
Handlebars.registerHelper('has_logging?', function(logging) {
    return logging;
});
Handlebars.registerHelper('format_finding_menu', function(key, finding) {
    r = '';
    if (finding['macro_items'].length != 0) {
        var config = finding['keyword_prefix'] + '_info';
        var entity = finding['entity'].split('.').pop();
        var keyword = finding['keyword_prefix'] + '_' + entity.substring(0, entity.length -1);
        r += '<li>';
        r += '<a href="javascript:list_findings(\'' + keyword + '\',' + config + '[\'violations\'], \'' + key + '\')">';
        r += finding['description'] + ' (' + finding['macro_items'].length + ')';
        r += '</a></li>';
    }
    return r;
});
Handlebars.registerHelper('format_users', function(users) {
    var len = users.length;
    if (len == 0) {
        return '';
    }
    len = len % 3;
    r = '<table width="100%" class="table">';
    for (u in users) {
        if (u%3 == 0) {
            r += '<tr>';
        }
        r += '<td width="33%" style="padding-left: 10px; text-align: center;"><a href="javascript:browseTo(\'iam_user\', \'' + users[u] + '\')">' + users[u] + '</td>';
        if (u%3 == 2) {
            r += '</tr>';
        }
    }
    if (len != 0) {
        for (i = len; i <3; i++) {
            r += '<td width="33%" style="padding-left: 10px; text-align: center;"></td>';
        }
        r += '</tr>';
    }
    r += '</table>';
    return r;
});
Handlebars.registerHelper('count', function(items) {
    var c = 0;
    for (i in items) {
        c = c + 1;
    }
    return c;
});
Handlebars.registerHelper('count_sg', function(regions) {
    var sgc = 0;
    for (r in regions) {
        for (vpc in regions[r]) {
            for (sg in regions[r][vpc]) {
                sgc = sgc +1;
            }
        }
    }
    return sgc;
});
Handlebars.registerHelper('count_acl', function(regions) {
    var aclc = 0;
    for (r in regions) {
        for (vpc in regions[r]) {
            for (acl in regions[r][vpc]['network_acls']) {
                aclc = aclc +1;
            }
        }
    }
    return aclc;
});
Handlebars.registerHelper('format_network_acls', function (acls, direction) {
    r = '<table class="table-striped" width="100%">';
    r += '<tr><td width="20%" class="text-center">Rule number</td>';
    r += '<td width="20%" class="text-center">Port</td>';
    r += '<td width="20%" class="text-center">Protocol</td>';
    r += '<td width="20%" class="text-center">' + direction + '</td>';
    r += '<td width="20%" class="text-center">Action</td></tr>';
    for (a in acls) {
        r += '<tr>';
        r += '<td width="20%" class="text-center">' + acls[a]['rule_number'] + '</td>';
        r += '<td width="20%" class="text-center">' + acls[a]['port_range'] + '</td>';
        r += '<td width="20%" class="text-center">' + acls[a]['protocol'] + '</td>';
        r += '<td width="20%" class="text-center">' + acls[a]['cidr_block'] + '</td>';
        r += '<td width="20%" class="text-center">' + acls[a]['rule_action'] + '</td>';
        r += '</tr>';
    }
    r += '</table>';
    return r;
});
Handlebars.registerHelper('ifPasswordAndKey', function(logins, access_keys, block) {
    if ((typeof logins != 'undefined' && logins != '') && (typeof access_keys != 'undefined' && access_keys != '')) {
        return block.fn(this);
    } else {
        return block.inverse(this);
    }
});
Handlebars.registerHelper('make_title', function(title) {
    return (title.charAt(0).toUpperCase() + title.substr(1).toLowerCase());
});
