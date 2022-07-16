import mdui from './mdui/js/mdui.esm'
import './mdui/css/mdui.min.css'
import './style.css'

// add click event
mdui.$('.mdui-tab > a').addClass('mdui-ripple')
mdui.$('.mdui-tab > a:not([disabled])').on('click', ({ target }) => {
  handlePageChange(target.href.split('-').pop())
})
mdui.$('#page-0-add').on('click', () => pages[0].addFamilyMember({}, true))
mdui.$('#save-btn').on('click', globalSave)
mdui.$('select').on('change', globalRefresh)

const proxy = 'https://zhszpj.vercel.app/proxy'
const $ = (e) => document.getElementById(e)

const $store = {
  get(key) {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : ''
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
}

// login
if (!$store.get('name')) $store.set('name', '未登录')
$('login-state').textContent = $store.get('name')

$('login').onclick = () => {
  if (!$store.get('isLogin'))
    mdui.dialog({
      title: '登录',
      content: `<form><div class="mdui-textfield"><label class="mdui-textfield-label">身份证号</label><input class="mdui-textfield-input" type="text" placeholder="（开头不用加G）" value="${$store.get(
        'username'
      )}"></div><div class="mdui-textfield"><label class="mdui-textfield-label">密码</label><input class="mdui-textfield-input" type="password" placeholder="忘了找你班主任去" value="${$store.get(
        'password'
      )}"></div></form>`,
      buttons: [
        { text: '取消' },
        {
          text: '登录',
          close: false,
          onClick: async (dialog) => {
            login(dialog)
          },
        },
      ],
      onOpen: (dialog) => {
        const $input = dialog.$element.find('input')
        const { 0: username, 1: password } = $input
        // 聚焦到输入框
        username.focus()
        $input.on('keyup', async (evt) => {
          if (evt.keyCode === undefined) return
          // 回车自动登录
          if (evt.keyCode === 13) {
            login(dialog)
          } else {
            $store.set('username', dialog.$element.find('input')[0].value)
            $store.set('password', dialog.$element.find('input')[1].value)
          }
        })
      },
    })
  else
    mdui.confirm(
      '你确定嘛？',
      '退出登录',
      () => {},
      () => {
        $store.set('isLogin', false)
        $store.set('session', null)
        $('login-state').textContent = '未登录'
      },
      {
        confirmText: '取消',
        cancelText: '退出登录',
      }
    )
}

async function login(dialog) {
  dialog.$element.find('a')[1].text = '登录中...'
  dialog.$element.find('a').attr('disabled', true)

  const {
    0: { value: username },
    1: { value: password },
  } = dialog.$element.find('input')

  $store.set('username', username)
  $store.set('password', password)

  const result = await fetch(proxy + '/login.do', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `username=G${username.toUpperCase()}&password=${password}&type=1`,
  })
    .then((res) => res.text())
    .catch(() => mdui.snackbar('登录失败'))

  const success = !!result.match('使用完成请退出')

  if (success) {
    mdui.snackbar('登录成功')

    await fetch(proxy + '/login.do', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `username=G${username.toUpperCase()}&password=${password}&type=1`,
    })

    $store.set('session', document.cookie.match(/SESSION=([\w-]+)/)[1])
    $store.set('isLogin', true)
    $store.set(
      'name',
      result
        .match(/tops1">.+\r\n.+/)[0]
        .split('  ')
        .pop()
    )

    $('login-state').textContent = $store.get('name')

    dialog.close()

    globalRefresh()
  } else {
    mdui.snackbar('登录失败，请检查身份证号和密码')
    dialog.$element.find('a')[1].text = '登录'
    dialog.$element.find('a').removeAttr('disabled')
  }
}

// ====== Pages ======
class Page0 {
  // mapping
  mapping = {
    basicInfo: {
      xm: '姓名',
      xb: '性别',
      mz: '民族',
      csny: '生日',
      zzmm: '政治面貌',
      lxfs: '电话',
      shi: { sp: true, name: '市', sub: 'shibh' },
      xianqu: { sp: true, name: '县(区)', sub: 'xianqubh' },
      xuexiao: { sp: true, name: '学校', sub: 'xuexiaobh' },
      __1: 6,
      txdz: { sp: true, name: '你家住哪', sub: 'postcode' },
      __3: 4,
      xjh: '学籍号',
      sfz: '身份证号',
      __2: 2,
      bj_id: '班级',
      sfzx: '是否在校',
    },
    familyMember: {
      __0: 2,
      xm: '姓名（必填）',
      cw: '关系',
      __1: 4,
      gzdw: '工作单位',
      __2: 3,
      lxdh: '联系电话',
    },
    selfInfo: {
      xqah: '兴趣爱好',
      tctc: '突出特长',
      bkzy: '报考专业',
      wlzy: '未来职业',
    },
  }
  async getBasicInfo() {
    const [item] = await fetch(
      proxy + '/getXsjbxx.do?SESSION=' + $store.get('session')
    )
      .then((e) => e.json())
      .then((data) => JSON.parse(data.list))
      .catch(() => mdui.snackbar('基本信息获取失败'))
    item.xb = item.xb ? '男' : '女'
    item.sfzx = item.sfzx ? '是' : '否'
    let size = 2,
      str = ''
    for (const key in this.mapping.basicInfo) {
      const name = this.mapping.basicInfo[key]
      if (key.slice(0, 2) === '__') {
        size = name
        continue
      }
      str += `<div class="mdui-textfield mdui-col-xs-${size}">
      <label class="mdui-textfield-label">${name.sp ? name.name : name}</label>
      <input class="mdui-textfield-input" type="text" value="${
        item[key]
      }" disabled/>${
        name.sp
          ? `<div class="mdui-textfield-helper">${item[name.sub]}</div>`
          : ''
      }</div>`
    }

    $('page-0-1').innerHTML = str
  }

  async getFamilyInfo() {
    const items = await fetch(
      proxy + '/getJtcyxx.do?SESSION=' + $store.get('session')
    )
      .then((e) => e.json())
      .catch(() => mdui.snackbar('家庭信息获取失败'))
    $('page-0-2').innerHTML = ''
    items.forEach((item) => {
      this.addFamilyMember(item)
    })
  }
  addFamilyMember(data, slow = false) {
    let str = `<div class="mdui-row" data-id="${data['id'] ?? ''}">`,
      size = 2
    for (const key in this.mapping.familyMember) {
      const name = this.mapping.familyMember[key]
      if (key.slice(0, 2) === '__') {
        size = name
        continue
      }
      str += `
      <div class="mdui-col-xs-${size}">
      <div class="mdui-textfield mdui-textfield-floating-label">
      <label class="mdui-textfield-label">${name}</label>
      <input class="mdui-textfield-input" type="text" value="${
        data[key] ?? ''
      }" ${key === 'xm' ? 'required' : ''}/></div></div>`
    }
    str += `
  <button class="mdui-col-xs-${1} mdui-btn mdui-btn-icon mdui-ripple page-0-del"
   style="margin-top:42px;">
  <i class="mdui-icon material-icons">clear</i></button></div>`
    if (slow) mdui.$('#page-0-2').append(str)
    else $('page-0-2').innerHTML += str
    mdui.$('button.page-0-del').on('click', ({ target }) => {
      const el = !target.type
        ? target.parentElement.parentElement
        : target.parentElement
      pages[0].deleteFamilyMember(el.parentElement)
    })
  }
  async deleteFamilyMember(dom) {
    await fetch(proxy + '/deleteJtcyxx.do?SESSION=' + $store.get('session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `id=${dom.dataset.id}`,
    })
      .then(() => dom.remove())
      .then(() => {
        mdui.snackbar('删除成功', {
          buttonText: '撤销',
          onButtonClick: () => {
            mdui.$('#page-0-2').append(dom)
            this.save('撤销')
            globalRefresh()
          },
        })
      })
      .catch(() => {
        mdui.snackbar('删除失败')
      })
  }
  async getSelfInfo() {
    const [item] = await fetch(
      proxy + '/getTcgh.do?SESSION=' + $store.get('session')
    )
      .then((e) => e.json())
      .catch(() => mdui.snackbar('个人信息获取失败'))
    let str = ''
    for (const key in this.mapping.selfInfo) {
      str += `<div class="mdui-textfield mdui-textfield-floating-label mdui-col-xs-12">
      <label class="mdui-textfield-label">${this.mapping.selfInfo[key]}</label>
      <textarea class="mdui-textfield-input" maxlength="114514">${item[key]}</textarea></div>`
    }
    $('page-0-3').innerHTML = str
    mdui.mutation()
  }

  async save(word = '保存') {
    const payload = {},
      familyData = []

    let i = 0
    ;[...$(`page-0-2`).children].forEach((el) => {
      let person = {}
      for (const key in this.mapping.familyMember) {
        if (key.slice(0, 2) === '__') continue
        person[key] = mdui.$(`#page-0-2 input`)[i++].value
      }
      person.id = el.dataset.id
      familyData.push(person)
    })
    payload['jtcyjson'] = JSON.stringify({ jtcylist: familyData })

    i = 0
    for (const key in this.mapping.selfInfo) {
      payload[key] = mdui.$(`#page-0-3 textarea`)[i++].value
    }

    return fetch(proxy + '/saveXsjbxx.do?SESSION=' + $store.get('session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: mdui.$.param(payload),
    })
      .then(() => {
        $('save-btn').classList.add('mdui-fab-hide')
        mdui.snackbar(word + '成功')
      })
      .catch(() => {
        mdui.snackbar(word + '失败')
      })
  }
  async refresh() {
    return Promise.all([
      this.getBasicInfo(),
      this.getFamilyInfo(),
      this.getSelfInfo(),
    ]).then(mdui.mutation)
  }
}
class Page1 {
  mapping = {
    info: {
      __0: 5,
      hdzt: '活动主题',
      __2: 3,
      xqid: '学期',
      __1: 4,
      state: '状态',
      __3: 3,
      hdlb: '活动类型',
      hdxs: '活动形式',
      __4: 4,
      zzdw: '组织单位',
      __5: 2,
      nian: '年份',
      __6: 6,
      hdksrq: '开始时间',
      hdjsrq: '结束时间',
    },
  }

  async getInfo() {
    const items = await fetch(
      proxy + '/getSxpdListRedis.do?SESSION=' + $store.get('session'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=studentReportInfo&xq=' + $('page-1-selector').value,
      }
    )
      .then((e) => e.json())
      .catch(() => mdui.snackbar('信息获取失败'))

    this.xsjbxxid = items[0].xsjbxxid

    items.forEach((item) => {
      let size = 3,
        str = `<div class="mdui-card mdui-col-xs-12 mdui-col-md-5 show-show-way"><div class="mdui-card-content mdui-row">`
      item.state =
        item.sfyx +
        ' - ' +
        [
          '',
          '已保存',
          '已提交',
          '已评价',
          '公示中',
          '已公示',
          '撤销公示',
          '公示确认',
          '学校驳回',
          '老师驳回',
        ][item.state]

      for (const key in this.mapping.info) {
        const name = this.mapping.info[key]
        if (key.slice(0, 2) === '__') {
          size = name
          continue
        }
        str += `
      <div class="mdui-textfield mdui-col-xs-${size}">
      <label class="mdui-textfield-label">${name}</label>
      <input class="mdui-textfield-input" type="text" value="${
        item[key] ?? ''
      }" disabled/></div>`
      }

      $('page-1-1').innerHTML = str + `</div></div>`
    })
  }
  async refresh() {
    return this.getInfo().then(mdui.mutation).catch(console.warn)
  }
  async save() {
    const payload = {}

    let data = []
    for (let i = 1; i <= 3; i++) {
      let grade = {},
        j = 0
      for (const key in this.mapping.info) {
        if (key.slice(0, 2) === '__') continue
        grade[key] = mdui.$(`#page-4-${i} input`)[j++].value
      }
      grade.nianji = i
      grade.xsjbxxid = this.xsjbxxid
      data.push(grade)
    }

    payload.sxjkjson = JSON.stringify({ sxjklist: data })

    return fetch(proxy + '/saveSxjk.do?SESSION=' + $store.get('session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: mdui.$.param(payload),
    })
      .then(() => {
        $('save-btn').classList.add('mdui-fab-hide')
        mdui.snackbar('保存成功')
      })
      .catch(() => {
        mdui.snackbar('保存失败')
      })
  }
}
class Page2 {}
class Page3 {}
class Page4 {
  mapping = {
    info: {
      sg: '身高(cm)',
      tz: '体重(kg)',
      xw: '胸围(cm)',
      slz: '视力(左)',
      sly: '视力(右)',
      xl: '心率(次/分)',
      xy: '血压(mmHg)',
      fhl: '肺活量',
    },
  }
  async getInfo() {
    const items = await fetch(
      proxy + '/getTzjk.do?SESSION=' + $store.get('session')
    )
      .then((e) => e.json())
      .catch(() => mdui.snackbar('信息获取失败'))

    this.xsjbxxid = items[0].xsjbxxid

    items.forEach((item) => {
      let size = 3,
        str = ''
      for (const key in this.mapping.info) {
        const name = this.mapping.info[key]
        if (key.slice(0, 2) === '__') {
          size = name
          continue
        }
        str += `
      <div class="mdui-textfield">
      <label class="mdui-textfield-label">${name}</label>
      <input class="mdui-textfield-input" type="text" value="${
        item[key] ?? ''
      }"/></div>`
      }

      $('page-4-' + item.nianji).innerHTML = str
    })
  }
  async refresh() {
    return this.getInfo().then(mdui.mutation).catch(console.warn)
  }
  async save() {
    const payload = {}

    let data = []
    for (let i = 1; i <= 3; i++) {
      let grade = {},
        j = 0
      for (const key in this.mapping.info) {
        if (key.slice(0, 2) === '__') continue
        grade[key] = mdui.$(`#page-4-${i} input`)[j++].value
      }
      grade.nianji = i
      grade.xsjbxxid = this.xsjbxxid
      data.push(grade)
    }

    payload.sxjkjson = JSON.stringify({ sxjklist: data })

    return fetch(proxy + '/saveSxjk.do?SESSION=' + $store.get('session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: mdui.$.param(payload),
    })
      .then(() => {
        $('save-btn').classList.add('mdui-fab-hide')
        mdui.snackbar('保存成功')
      })
      .catch(() => {
        mdui.snackbar('保存失败')
      })
  }
}
class Page5 {
  mapping = {
    info: {
      __0: 11,
      jilu: '内容',
      __1: 1,
      nian: '年份',
    },
  }
  async getInfo() {
    const items = await fetch(
      proxy + '/getXlsz.do?SESSION=' + $store.get('session')
    )
      .then((e) => e.json())
      .catch(() => mdui.snackbar('信息获取失败'))

    this.xsjbxxid = items[0].xsjbxxid

    items.forEach((item) => {
      $('page-5-' + item.rwid).innerHTML = `
      <div class="mdui-textfield mdui-col-xs-11">
      <label class="mdui-textfield-label">内容</label>
      <textarea class="mdui-textfield-input" type="text" maxlength="114514">${
        item.jilu ?? ''
      }</textarea></div><div class="mdui-textfield mdui-textfield-floating-label mdui-col-xs-1">
      <label class="mdui-textfield-label">年份</label>
      <input class="mdui-textfield-input" type="text" value="${
        item.nian ?? ''
      }"/></div>`
    })
  }
  async refresh() {
    return this.getInfo().then(mdui.mutation).catch(console.warn)
  }
  async save() {
    const payload = {}

    let data = []
    for (let i = 1; i <= 3; i++) {
      data.push({
        rwid: i,
        jilu: mdui.$(`#page-5-${i} textarea`)[0].value,
        nian: mdui.$(`#page-5-${i} input`)[0].value,
        xsjbxxid: this.xsjbxxid,
      })
    }

    payload.xlszjson = JSON.stringify({ xlszlist: data })
    payload.xsjbxxid = this.xsjbxxid

    return fetch(proxy + '/saveXlsz.do?SESSION=' + $store.get('session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: mdui.$.param(payload),
    })
      .then(() => {
        $('save-btn').classList.add('mdui-fab-hide')
        mdui.snackbar('保存成功')
      })
      .catch(() => {
        mdui.snackbar('保存失败')
      })
  }
}
class Page6 {}
class Page7 {}
class Page8 {}
class Page9 {}

const pages = [
  new Page0(),
  new Page1(),
  new Page2(),
  new Page3(),
  new Page4(),
  new Page5(),
  new Page6(),
  new Page7(),
  new Page8(),
  new Page9(),
]

if (!$store.get('pageId')) $store.set('pageId', 0)
mdui.$('.mdui-tab').children()[$store.get('pageId')].click()

function handlePageChange(id) {
  $store.set('pageId', id)
  globalRefresh()
}

function globalRefresh() {
  if (!$store.get('isLogin')) return
  document.oninput = null
  setTimeout(() => {
    pages[$store.get('pageId')].refresh().then(() => {
      document.oninput = () => $('save-btn').classList.remove('mdui-fab-hide')
    }),
      50
  })
}

function globalSave() {
  pages[$store.get('pageId')].save().then(globalRefresh)
}

// save when press Ctrl+S
document.onkeydown = (event) => {
  if (event.ctrlKey && event.keyCode === 83) {
    event.preventDefault()
    globalSave()
  }
}
