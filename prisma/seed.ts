import { db } from '../src/lib/db'

// Default config builders for each section type
const cfg = (o: Record<string, unknown>) => JSON.stringify(o)

async function seed() {
  // ===== Site settings =====
  await db.siteSetting.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      fullName: 'ابوالفضل دهنوی',
      displayTitle: 'شهید ابوالفضل دهنوی',
      subtitle: 'امدادگر یکم جمعیت هلال احمر',
      martyrdomDate: '۱۵ فروردین ۱۴۰۵',
      martyrdomPlace: 'شهرستان مبارکه، اصفهان',
      role: 'امدادگر یکم جمعیت هلال احمر',
      birthDate: '',
      heroIntro:
        'امدادگری که جان خود را فدای نجات جان دیگران کرد؛ نماد ایثار، فداکاری و عشق به انسان‌ها. روحش شاد و راهش پر رهرو باد.',
      publicUrl: '',
      adminPassword: 'abolfazl1405',
      globalFontKey: 'vazirmatn',
      headingFontKey: 'nastaliq',
      accent: 'emerald',
    },
  })

  // ===== Pages =====
  // Home
  const home = await db.page.create({
    data: {
      slug: 'home',
      title: 'خانه',
      subtitle: 'یادبود جاودان',
      showInNav: true,
      isHome: true,
      navIcon: 'Home',
      order: 0,
    },
  })
  await db.section.create({
    data: {
      pageId: home.id,
      type: 'hero',
      order: 0,
      title: 'بخش اصلی',
      config: cfg({
        ctaButtons: [
          { label: 'زندگی‌نامه', pageSlug: 'biography' },
          { label: 'گالری یادبود', pageSlug: 'gallery' },
        ],
      }),
    },
  })

  // Biography
  const bio = await db.page.create({
    data: {
      slug: 'biography',
      title: 'زندگی‌نامه',
      subtitle: 'روایتی از زندگی، خدمت و شهادت',
      showInNav: true,
      navIcon: 'BookOpen',
      order: 1,
    },
  })
  const bioSections = [
    {
      title: 'معرفی و ولادت',
      content:
        'شهید ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر، از جمله انسان‌های مخلصی بود که جان خود را در راه نجات جان دیگران نثار کرد. او با قلبی پر از عشق و ایمان، زندگی‌اش را وقف خدمت به مردمی کرده بود که در سخت‌ترین لحظات به دستان پر مهر او پناه می‌بردند. ابوالفضل با روحیه‌ای آرام و باوری استوار، الگویی از انسان مؤمن و مدافع حقیقت بود.',
      layout: 'full',
    },
    {
      title: 'خدمت در جمعیت هلال احمر',
      content:
        'ابوالفضل با عضویت در جمعیت هلال احمر، رسالت زندگی خود را در امدادرسانی به هم‌وطنان یافت. او در بحران‌ها، حوادث و سوانح طبیعی، پیشتاز گروه‌های امدادی بود و با شجاعت و ازخودگذشتگی، بارها جان انسان‌هایی را از مرگ رهانید. همکارانش او را فردی دلسوز، متعهد و بی‌ادعا توصیف می‌کنند که همیشه اولین کسی بود که برای کمک به سمت خطر می‌دوید.\n\nامدادگر یکم بودن برای او تنها یک عنوان شغلی نبود؛ بلکه تجلی باطنی از عشق به خلق بود. او معتقد بود خدمت به مردم، عبادتی است که قربانی‌ترین شکل آن را در روز شهادتش به نمایش گذاشت.',
      layout: 'full',
    },
    {
      title: 'روایت امدادگری که می‌دانست شهید می‌شود',
      content:
        'از ابوالفضل روایت است که پیش از شهادت، با باوری عمیق و آرامشی شگرف، از شهادت خود آگاه بود. او روزهای پایانی زندگی‌اش را با آمادگی قلبی و معنوی سپری کرد و به نزدیکانش نشانه‌هایی از وداع می‌داد. این آگاهی، نه از روی ترس، که از روی عشق و رضایت بود؛ عشقی که او را به سوی فدا و ایثار رهنمون ساخت.\n\nدر صبح سرنوشت‌ساز، هنگامی که آژیر خطر به صدا درآمد، او برخلاف غریزه بقای انسان، به سمت صحنه حادثه شتافت تا شاید جان دیگری نجات یابد. و در همان لحظه، در مسیر امدادرسانی، به شهادت رسید.',
      layout: 'full',
    },
    {
      title: 'روز شهادت',
      content:
        'در صبح شنبه، پانزدهم فروردین ماه، شهرستان مبارکه اصفهان هدف حمله هوایی قرار گرفت. ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر، در حالی که برای نجات مجروحان و آسیب‌دیدگان به صحنه حادثه اعزام شده بود، در این حمله به شهادت رسید.\n\nاو چهارمین امدادگر هلال احمر بود که در پی این حملات به درجه شهادت نائل آمد؛ شهدایی که جان خود را فدای انسانیتی کردند که نماد آن بودند. کمیته بین‌المللی صلیب سرخ نیز در پیامی، فقدان او را به رسمیت شناخت و ضمن ابراز تأسف، جایگاه والای انسانی‌اش را ستود.',
      layout: 'full',
    },
    {
      title: 'میراث و یادبود',
      content:
        'شهادت ابوالفضل دهنوی، نه پایان یک زندگی، که آغاز یک میراث جاودان بود. نام او در فهرست شهدای امدادگر هلال احمر ثبت شد و خانواده‌اش از سوی بنیاد شهید تقدیر گردید. اما بزرگ‌ترین میراث او، روحی بود که در دل‌ها زنده ماند؛ روحی که می‌گوید خدمت به خلق، با ادای آن پایان نمی‌یابد.\n\nاین سایت، یادبودی است کوچک برای مردی بزرگ؛ تا هر که این صفحه را می‌گشاید، یادآور شود که هنوز انسان‌هایی هستند که در سکوت، عشق را معنا می‌کنند و در فدا، جاودانه می‌شوند.\n\n«الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ»',
      layout: 'full',
    },
  ]
  for (let i = 0; i < bioSections.length; i++) {
    await db.section.create({
      data: {
        pageId: bio.id,
        type: 'text',
        order: i,
        title: bioSections[i].title,
        config: cfg({ content: bioSections[i].content, layout: bioSections[i].layout, image: null }),
      },
    })
  }

  // Gallery
  const gallery = await db.page.create({
    data: {
      slug: 'gallery',
      title: 'گالری یادبود',
      subtitle: 'تصاویر و لحظات ماندگار',
      showInNav: true,
      navIcon: 'Images',
      order: 2,
    },
  })
  await db.section.create({
    data: {
      pageId: gallery.id,
      type: 'gallery',
      order: 0,
      title: 'گالری تصاویر و ویدیوها',
      config: cfg({ items: [], filterable: true, columns: 3 }),
    },
  })

  // Timeline
  const timeline = await db.page.create({
    data: {
      slug: 'timeline',
      title: 'خط زمانی',
      subtitle: 'مسیر زندگی در نگاهی کوتاه',
      showInNav: true,
      navIcon: 'Clock',
      order: 3,
    },
  })
  const timelineEvents = [
    { date: 'زمان ولادت', title: 'ولادت', description: 'ابوالفضل در خانواده‌ای مؤمن و دلسوز دیده به جهان گشود.', icon: 'Baby' },
    { date: 'سال‌های جوانی', title: 'رشد و پرورش', description: 'با روحیه‌ای مهربان و دغدغه‌مند بزرگ شد؛ عشق به خدمت در نهادش ریشه داشت.', icon: 'Heart' },
    { date: 'پیوستن به هلال احمر', title: 'آغاز خدمت امدادی', description: 'به جمعیت هلال احمر پیوست و رسالت نجات جان انسان‌ها را برگزید.', icon: 'HandHeart' },
    { date: 'امدادرسانی‌ها', title: 'پیشتاز در بحران‌ها', description: 'در حوادث و سوانح متعدد، همواره اولین امدادرسان حاضر در صحنه بود.', icon: 'ShieldPlus' },
    { date: '۱۵ فروردین ۱۴۰۵', title: 'روز شهادت', description: 'در حمله هوایی به مبارکه اصفهان، در مسیر امدادرسانی به شهادت رسید.', icon: 'Flame' },
    { date: 'بعد از شهادت', title: 'تجلیل و میراث', description: 'نامش در فهرست شهدای امدادگر ثبت شد و خانواده‌اش تقدیر گردید.', icon: 'Award' },
  ]
  await db.section.create({
    data: {
      pageId: timeline.id,
      type: 'timeline',
      order: 0,
      title: 'مسیر زندگی',
      config: cfg({ events: timelineEvents }),
    },
  })

  // Memories (quotes + guestbook)
  const memories = await db.page.create({
    data: {
      slug: 'memories',
      title: 'یادبودها',
      subtitle: 'نقل‌قول‌ها و پیام‌های یادبود',
      showInNav: true,
      navIcon: 'Heart',
      order: 4,
    },
  })
  await db.section.create({
    data: {
      pageId: memories.id,
      type: 'quotes',
      order: 0,
      title: 'نقل‌قول‌ها',
      config: cfg({
        quotes: [
          { text: 'امدادگری که می‌دانست شهید می‌شود، با رضایت قلبی به استقبال سرنوشتش رفت.', author: 'روایت از همکاران' },
          { text: 'کسی که جان خود را فدای نجات دیگران کند، زنده است در میان قومش.', author: '' },
          { text: 'وَلَا تَحْسَبَنَّ الَّذِينَ قُتِلُوا فِي سَبِيلِ اللَّهِ أَمْوَاتًا بَلْ أَحْيَاءٌ عِنْدَ رَبِّهِمْ يُرْزَقُونَ', author: 'قرآن کریم — آل عمران ۱۶۹' },
          { text: 'عشق، آن است که جان بدهی، نه آن که جان بگیری. ابوالفضل، عاشق بود.', author: '' },
        ],
      }),
    },
  })
  await db.section.create({
    data: {
      pageId: memories.id,
      type: 'guestbook',
      order: 1,
      title: 'کتاب یادبود',
      config: cfg({}),
    },
  })

  // Blog
  const blog = await db.page.create({
    data: {
      slug: 'blog',
      title: 'بلاگ و خبر',
      subtitle: 'مراسم یادبود و کارهای خیر به نیت شهید',
      showInNav: true,
      navIcon: 'Newspaper',
      order: 5,
    },
  })
  await db.section.create({
    data: {
      pageId: blog.id,
      type: 'blogList',
      order: 0,
      title: 'اخبار و یادبودها',
      config: cfg({ count: 12, showExcerpt: true }),
    },
  })

  // ===== Default blog posts =====
  const posts = [
    {
      title: 'کاشت دویست نهال به یاد شهید ابوالفضل دهنوی',
      excerpt: 'به نیت شهید و در مسیر آرمان‌های امدادی او، دویست نهال در منطقه مبارکه کاشته شد.',
      content:
        'به مناسبت سالگرد شهادت ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر، جمعی از دوستان و همکارانش به نیت او دویست نهال زردآلو و بادام در حاشیه شهرستان مبارکه به زمین سپردند.\n\nاین اقدام نمادین، یادآور زندگی و خدمت ابوالفضل است؛ مردی که جانش را فدای نجات دیگران کرد و حالا در قالب درختانی که ریشه می‌زنند و میوه می‌دهند، حضورش ادامه می‌یابد.\n\nمراسم با حضور خانواده شهید، امدادگران هلال احمر و مردم منطقه برگزار شد و در پایان، هر شرکت‌کننده نام خود را بر روی نهال کاشته شده ثبت کرد.',
      coverImage: '/decor/landscape.png',
      tags: 'محیط زیست, یادبود, نهال کاری',
      publishedAt: new Date().toISOString(),
      featured: true,
    },
    {
      title: 'تجلیل مسئولین از خانواده شهید',
      excerpt: 'در مراسمی با حضور استاندار و مدیران جمعیت هلال احمر، از خانواده شهید ابوالفضل دهنوی تقدیر شد.',
      content:
        'مراسم تجلیل از خانواده شهید ابوالفضل دهنوی با حضور استاندار اصفهان، رئیس جمعیت هلال احمر و جمعی از مدیران و امدادگران برگزار شد.\n\nدر این مراسم، ضمن بازخوانی زندگی و خدمات شهید، از ایثار و فداکاری خانواده ایشان تقدیر به عمل آمد. رئیس هلال احمر در سخنان خود ابوالفضل را «نماد امدادگر واقعی» خواند و تأکید کرد که میراث او راهنمای نسل‌های آینده‌ی امدادگران خواهد بود.',
      coverImage: '/decor/crescent.png',
      tags: 'تجلیل, خانواده شهید, هلال احمر',
      publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ]
  for (const p of posts) {
    await db.blogPost.create({ data: p })
  }

  // ===== A couple of default guestbook messages (if none) =====
  const msgCount = await db.guestMessage.count()
  if (msgCount === 0) {
    await db.guestMessage.createMany({
      data: [
        { name: 'رفیق قدیمی', text: 'یادت گرامی رفیق. همیشه اولین کسی بودی که برای کمک می‌دویدی. روحت شاد.', approved: true },
        { name: 'همکار هلال احمر', text: 'ابوالفضل، تو الگوی ما در امدادرسانی بودی. شجاعت و ازخودگذشت‌ات هیچ‌گاه از یاد ما نمی‌رود.', approved: true },
      ],
    })
  }

  console.log('✓ Seed complete — pages, sections, blog posts, settings')
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
