from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    HRFlowable, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import Flowable

PINK       = HexColor('#E91E8C')
LIGHT_PINK = HexColor('#FFB6D9')
BLUSH      = HexColor('#FFF0F7')
DEEP_PUR   = HexColor('#4A154B')
SOFT_PUR   = HexColor('#9B59B6')
GOLD       = HexColor('#D4AF37')
LIGHT_GOLD = HexColor('#FFF8DC')
DARK_GRAY  = HexColor('#2C2C2C')
MED_GRAY   = HexColor('#555555')
LIGHT_GRAY = HexColor('#F5F5F5')

PAGE_W, PAGE_H = A4


def styles():
    S = {}
    S['ch'] = ParagraphStyle('ch', fontName='Helvetica-Bold', fontSize=26,
        textColor=DEEP_PUR, alignment=TA_CENTER, leading=32, spaceBefore=10, spaceAfter=14)
    S['sec'] = ParagraphStyle('sec', fontName='Helvetica-Bold', fontSize=15,
        textColor=PINK, alignment=TA_LEFT, leading=22, spaceBefore=12, spaceAfter=6)
    S['day_focus'] = ParagraphStyle('day_focus', fontName='Helvetica-Oblique', fontSize=13,
        textColor=DEEP_PUR, alignment=TA_CENTER, leading=18, spaceAfter=10)
    S['body'] = ParagraphStyle('body', fontName='Helvetica', fontSize=11,
        textColor=DARK_GRAY, alignment=TA_JUSTIFY, leading=17, spaceAfter=8)
    S['bullet'] = ParagraphStyle('bullet', fontName='Helvetica', fontSize=11,
        textColor=DARK_GRAY, alignment=TA_LEFT, leading=17,
        leftIndent=18, firstLineIndent=-14, spaceAfter=4)
    S['quote'] = ParagraphStyle('quote', fontName='Helvetica-Oblique', fontSize=12,
        textColor=SOFT_PUR, alignment=TA_CENTER, leading=18, spaceBefore=8, spaceAfter=8)
    S['intro'] = ParagraphStyle('intro', fontName='Helvetica-Bold', fontSize=22,
        textColor=DEEP_PUR, alignment=TA_CENTER, leading=28, spaceBefore=10, spaceAfter=10)
    S['toc_ch'] = ParagraphStyle('toc_ch', fontName='Helvetica-Bold', fontSize=12,
        textColor=DEEP_PUR, alignment=TA_LEFT, leading=20, spaceBefore=6)
    S['toc_e'] = ParagraphStyle('toc_e', fontName='Helvetica', fontSize=11,
        textColor=MED_GRAY, alignment=TA_LEFT, leading=18, leftIndent=14)
    return S


class DayBox(Flowable):
    def __init__(self, day_num, title, width):
        super().__init__()
        self.day_num = day_num
        self.title   = title
        self.w       = width
        self.h       = 54

    def draw(self):
        c = self.canv
        c.setFillColor(DEEP_PUR)
        c.roundRect(0, 0, self.w, self.h, 10, fill=1, stroke=0)
        c.setFillColor(PINK)
        c.roundRect(0, 0, self.w * 0.36, self.h, 10, fill=1, stroke=0)
        c.setFillColor(DEEP_PUR)
        c.rect(self.w * 0.28, 0, self.w * 0.10, self.h, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 20)
        c.drawCentredString(self.w * 0.18, self.h / 2 - 7, f'Day {self.day_num}')
        c.setFont('Helvetica-Bold', 14)
        c.drawString(self.w * 0.40, self.h / 2 - 6, self.title)

    def wrap(self, *args):
        return (self.w, self.h)


def draw_cover(c, doc):
    c.setFillColor(DEEP_PUR)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(HexColor('#6A0572'))
    c.circle(PAGE_W * 0.85, PAGE_H * 0.85, 90, fill=1, stroke=0)
    c.setFillColor(HexColor('#5C0464'))
    c.circle(PAGE_W * 0.12, PAGE_H * 0.18, 70, fill=1, stroke=0)
    c.setStrokeColor(LIGHT_PINK)
    c.setLineWidth(2)
    c.circle(PAGE_W / 2, PAGE_H / 2, 200, fill=0, stroke=1)
    c.setFillColor(PINK)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, fill=1, stroke=0)
    c.rect(0, 0, PAGE_W, 8, fill=1, stroke=0)
    # text
    c.setFillColor(white)
    c.setFont('Helvetica-Bold', 52)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.70, 'GLOW UP')
    c.setFont('Helvetica-Bold', 26)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.62, 'The 30-Day Guide')
    c.setFillColor(LIGHT_PINK)
    c.setFont('Helvetica', 15)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.555, 'for Women Who Are Ready to Rise')
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(PAGE_W * 0.28, PAGE_H * 0.525, PAGE_W * 0.72, PAGE_H * 0.525)
    c.setFillColor(LIGHT_GOLD)
    c.setFont('Helvetica-Oblique', 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.49,
        '"Your best self is waiting — 30 days, one step at a time."')
    pillars = ['MIND', 'BODY', 'SKIN', 'STYLE', 'SOUL']
    bw = 68
    total = len(pillars) * bw + (len(pillars) - 1) * 10
    sx = (PAGE_W - total) / 2
    for i, p in enumerate(pillars):
        bx = sx + i * (bw + 10)
        c.setFillColor(PINK if i % 2 == 0 else SOFT_PUR)
        c.roundRect(bx, PAGE_H * 0.38, bw, 30, 6, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 11)
        c.drawCentredString(bx + bw / 2, PAGE_H * 0.38 + 9, p)
    c.setFillColor(LIGHT_PINK)
    c.setFont('Helvetica', 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.30, 'A Complete Transformation Handbook')


def draw_normal(c, doc):
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(BLUSH)
    c.rect(0, 0, 12, PAGE_H, fill=1, stroke=0)
    c.setFillColor(PINK)
    c.rect(0, PAGE_H - 5, PAGE_W, 5, fill=1, stroke=0)
    c.setFillColor(LIGHT_GRAY)
    c.rect(0, 0, PAGE_W, 22, fill=1, stroke=0)
    c.setFillColor(MED_GRAY)
    c.setFont('Helvetica', 8)
    c.drawCentredString(PAGE_W / 2, 7, 'Your 30-Day Glow Up Guide  •  glowup30.com')


def first_page(c, doc):
    draw_cover(c, doc)


def later_pages(c, doc):
    draw_normal(c, doc)


# ── DATA ───────────────────────────────────────────────────────────────────────

DAYS = [
    (1, "Declare Your Glow Up", "MIND",
     "Today is day one. You've already done something most people never do — you started. "
     "A glow up begins with a single, clear, non-negotiable decision: that you deserve better "
     "and you're willing to do the work to get there.",
     ["Write a 'Glow Up Declaration' — a letter to yourself about who you're becoming and why.",
      "Take a 'Before' photo (for your eyes only — to celebrate how far you'll come).",
      "Delete 3 apps or accounts that make you feel bad about yourself.",
      "Set your phone to Do Not Disturb for 1 hour today and use that time intentionally."],
     "What does the best version of me look like — in every area of my life?",
     "I am worthy of a beautiful life, and I am building it one day at a time."),

    (2, "The Skincare Reset", "SKIN",
     "Glowing skin is the foundation of a physical glow up. Today you'll build (or reset) your "
     "skincare routine. You don't need 15 steps — you need consistency with the basics.",
     ["Identify your skin type (oily, dry, combination, sensitive).",
      "Morning: Gentle cleanser → Vitamin C serum → Moisturiser → SPF 30+.",
      "Evening: Double cleanse → Retinol or niacinamide → Rich moisturiser.",
      "Drink at least 2.5 litres of water today — hydration starts from within.",
      "Change your pillowcase; consider investing in a silk one."],
     "What has my relationship with self-care been like, and what do I want it to become?",
     "My skin is glowing, healthy, and loved."),

    (3, "Move Your Body", "BODY",
     "Movement is medicine. You don't need a gym or two-hour sessions. You need to get your body "
     "moving in a way that feels good and makes you feel strong.",
     ["Complete a 30-minute workout: YouTube video, brisk walk, yoga, or home circuit.",
      "Stretch for 10 minutes in the morning — your posture affects how confident you appear.",
      "Take the stairs, walk short distances, add incidental movement throughout the day.",
      "Notice how you feel after moving — write it down in 2–3 sentences."],
     "What does it feel like to live in a body I'm proud of?",
     "My body is strong, capable, and worthy of every care I give it."),

    (4, "Closet Detox", "STYLE",
     "You can't build a new aesthetic while holding onto old clutter. Today is about clearing "
     "space — physically and mentally — for a style that reflects who you're becoming.",
     ["Pull everything from your wardrobe. Keep only what fits, flatters, and makes you feel good.",
      "Create three piles: Keep, Donate, and Bin. Be ruthless.",
      "Identify 3 wardrobe 'gaps' — things you keep wishing you had.",
      "Save inspiration photos for a personal style mood board on Pinterest or your phone.",
      "Organise what remains by category and colour."],
     "What does my ideal style say about me to the world?",
     "I dress intentionally for the woman I am becoming."),

    (5, "Nourish From Within", "BODY",
     "What you eat directly affects how you look and feel. Today isn't about restriction — "
     "it's about learning to nourish your body like it's the only one you have.",
     ["Eat at least 5 servings of vegetables and fruit today.",
      "Cut or significantly reduce sugar, ultra-processed food, and alcohol for the challenge.",
      "Prioritise glow foods: avocado, salmon, blueberries, leafy greens, eggs, sweet potato.",
      "Prep one healthy meal from scratch — cooking for yourself is an act of self-love.",
      "Consider a daily supplement: collagen, biotin, vitamin D, and omega-3."],
     "How does food make me feel — and am I eating to nourish or to numb?",
     "I fuel my body with love, and my body radiates that love back."),

    (6, "Design Your Morning Ritual", "SOUL",
     "How you start your morning sets the tone for your entire day. Radiant women don't "
     "reach for their phones the moment they wake up — they invest in themselves first.",
     ["Wake up 45 minutes earlier than usual today.",
      "No phone for the first 30 minutes of your morning.",
      "Ritual: Warm lemon water → 10-min stretch or meditate → 5-min journal → Affirmations.",
      "Make your bed — a small win that signals 'I take care of my space.'",
      "Eat breakfast without scrolling. Taste your food. Be present."],
     "What kind of mornings do I want to have, and what does that say about how I value myself?",
     "I own my mornings, and my mornings shape my glow."),

    (7, "Week 1 Reflection", "MIND",
     "You made it through your first week. Before rushing into Week 2, pause. Reflection is "
     "where real growth lives. The women who glow hardest know themselves deeply.",
     ["Re-read your Glow Up Declaration from Day 1. What would you add or change?",
      "Write 7 things you're grateful for — one from each day this week.",
      "What habit felt the best? Commit to making it permanent.",
      "Take an active rest day: foam roll, stretch, or take a gentle walk.",
      "Do something purely for joy today — bath, face mask, favourite film, dancing."],
     "What have I learned about myself this week that I didn't know before?",
     "I am proud of every step I've taken. I am already glowing."),

    (8, "Build Your Fitness Plan", "BODY",
     "This week we go deeper into the physical glow up. Your body responds to consistent, "
     "loving attention. Today, build a concrete fitness plan for the next three weeks.",
     ["Choose your workout style: strength, pilates, running, yoga, dance — pick what excites you.",
      "Schedule your workouts for the next 7 days as non-negotiable appointments.",
      "Try one new class or YouTube workout you've never attempted.",
      "Set a realistic fitness goal: 5K run, 10 push-ups, 60-second plank.",
      "Track every workout this week in a journal or app."],
     "What does a strong, healthy body mean to me beyond how it looks?",
     "I show up for my body consistently, and it rewards me with strength and radiance."),

    (9, "Hair Glow Up", "STYLE",
     "Your hair is your crown. Whether long, short, natural, or coloured — today is about "
     "giving your hair intentional, loving care.",
     ["Deep condition or mask your hair today.",
      "If your ends are dry or split, book a trim or do a small one yourself.",
      "Research what your hair actually needs: protein, moisture, scalp care, or length retention.",
      "Invest in quality shampoo and conditioner suited to your specific hair type.",
      "Massage your scalp for 5 minutes to boost circulation and promote growth."],
     "How do I feel when my hair looks and feels its absolute best?",
     "My hair is healthy, vibrant, and a reflection of the care I give myself."),

    (10, "Digital Detox", "MIND",
     "Your phone may be one of the biggest threats to your glow up. Doom scrolling, comparison, "
     "and constant stimulation drain your energy, creativity, and confidence.",
     ["Spend a full 24 hours (or at least 12) with minimal social media.",
      "Turn off all non-essential notifications permanently starting today.",
      "Use the freed time for: reading, journaling, walking, cooking, or creating something.",
      "Audit who you follow — unfollow anyone who consistently makes you feel less than.",
      "Replace your morning scroll with music, a podcast, or silence."],
     "What do I use social media for — is it serving my growth or stealing my peace?",
     "I protect my peace and my mind. I choose what I consume and how I feel."),

    (11, "Posture & Presence", "BODY",
     "Confidence is physical before it's mental. How you hold your body sends a message — "
     "to others and to yourself. Standing tall is the simplest free glow up available.",
     ["Notice your posture throughout the day — shoulders back, chin level, chest open.",
      "Do 10 minutes of posture-correcting exercises: wall angels, cat-cow, chin tucks.",
      "Practice 'power poses' for 2 minutes before any significant moment.",
      "When you walk, walk like you own the room — eyes forward, pace intentional.",
      "Record a video of yourself walking or sitting; observe and adjust."],
     "How does my body language reflect or contradict the woman I want to be?",
     "I walk with grace, stand with strength, and take up the space I deserve."),

    (12, "Financial Glow Up", "MIND",
     "Financial health is a critical part of a real glow up. Money stress affects your skin, "
     "sleep, mood, and confidence. Financial empowerment IS self-care.",
     ["Write down your income and all monthly expenses — be honest.",
      "Create a simple budget: 50% needs, 30% wants, 20% savings and investments.",
      "Delete saved card details from shopping apps to interrupt impulse spending.",
      "Open a 'Glow Up Fund' — even €20/month towards yourself changes your mindset.",
      "Read or listen to one chapter of a personal finance book today."],
     "What is my honest relationship with money, and how can I make it healthier?",
     "I am financially empowered and intentionally building a life I love."),

    (13, "Feminine Energy Day", "SOUL",
     "Femininity is not weakness — it's power in its softest, most magnetic form. Tapping "
     "into your feminine energy makes you more radiant, intuitive, and attractive.",
     ["Wear something that makes you feel beautiful today, even if you're at home.",
      "Cook or prepare something nourishing and eat it slowly, mindfully.",
      "Move your body in a feminine way: dance freely, stretch, walk barefoot outdoors.",
      "Light a candle, play soft music, and create beauty in your environment.",
      "Practice receiving: accept a compliment today without deflecting."],
     "What does femininity mean to me, and how do I want to embody it authentically?",
     "I am soft, I am strong, I am radiant. My feminine energy is magnetic."),

    (14, "Week 2 Reflection", "SOUL",
     "Two weeks in. You're not the same woman who started on Day 1 — even if it doesn't "
     "feel dramatic yet. Growth is often invisible right up until it becomes undeniable.",
     ["Write a letter to yourself from 6 months into the future. What does she say?",
      "Review your fitness and nutrition habits this week — what's working?",
      "List 5 concrete things you're doing differently than two weeks ago.",
      "Do a full skincare routine and spend extra time on self-care tonight.",
      "Get 8–9 hours of sleep. Rest is not laziness — it is growth."],
     "Where am I already seeing changes, and where do I need to double down?",
     "I am halfway through my transformation, and I am unstoppable."),

    (15, "Confidence Overhaul", "MIND",
     "Confidence is not a personality trait — it's a practice. It's built brick by brick "
     "through repeated action. Today, you do the scary thing.",
     ["Write 10 things you genuinely love and admire about yourself.",
      "Do one thing that scares you: speak up, start the project, send the message.",
      "Count your unnecessary 'sorrys' today — stop apologising for existing.",
      "Say no to one thing you don't want to do but would normally agree to out of guilt.",
      "Look in the mirror and say three genuine compliments to yourself out loud."],
     "Where am I dimming my light, and what would happen if I finally stopped?",
     "I am confident, capable, and completely enough exactly as I am."),

    (16, "Advanced Skincare", "SKIN",
     "By now your basic routine should be forming. Today we go deeper — targeting your "
     "specific skin concerns and adding treatments for a lit-from-within glow.",
     ["Add weekly exfoliation: AHA (glycolic/lactic acid) for dullness, BHA (salicylic) for pores.",
      "Try a sheet mask or overnight sleeping mask tonight.",
      "Start using an eye cream — under-eye care is often overlooked but very visible.",
      "Assess your diet: are you getting enough zinc, vitamin E, and omega-3s?",
      "Introduce gua sha or a jade roller to reduce puffiness and improve circulation."],
     "How has my skin changed since Day 2, and what does it still need?",
     "My skin glows because I love it, nourish it, and protect it consistently."),

    (17, "Build Your Vision", "SOUL",
     "A glow up without direction is just a makeover. The deepest transformation happens "
     "when your outer changes align with a clear, compelling inner vision.",
     ["Create a vision board (digital or physical) for your ideal life in 12 months.",
      "Define your top 3 goals for the year across: Career, Health, and Relationships.",
      "Write your ideal daily routine from waking up to falling asleep.",
      "Identify the ONE thing holding you back the most right now. Name it. Face it.",
      "Take one small, concrete action towards your biggest goal today."],
     "If I knew I couldn't fail, what life would I be building right now?",
     "My vision is clear, my purpose is real, and I walk towards it every single day."),

    (18, "Relationship Audit", "SOUL",
     "The people around you either fuel your glow or dim it. A real glow up requires "
     "honest assessment of who you're investing your energy in — and whether it's mutual.",
     ["List the 5 people you spend the most time with. How does each one make you feel?",
      "Identify one draining relationship. Set a boundary or mindfully limit contact.",
      "Reach out to one person who genuinely inspires and uplifts you.",
      "Write what you want more of from your friendships and relationships.",
      "Be the friend you wish you had — check in on someone authentically today."],
     "Do the people in my life reflect who I am becoming, or who I'm trying to leave behind?",
     "I attract relationships that are loving, reciprocal, and aligned with my growth."),

    (19, "Push Your Fitness", "BODY",
     "By now you should be feeling a difference. Today is about pushing further and adding "
     "something new to your physical practice.",
     ["Increase workout intensity by 10%: more weight, faster pace, or longer duration.",
      "Try a new physical activity you've never done: climbing, swimming, kickboxing, ballet.",
      "Focus on recovery: contrast shower, foam rolling, magnesium supplement before bed.",
      "Cook a high-protein meal today: aim for 25–30g protein per meal.",
      "Be in bed by 10pm — sleep is when your body repairs, rebuilds, and glows."],
     "What does my body feel like now compared to Day 3? What has genuinely shifted?",
     "I am getting stronger, leaner, and more radiant every single day."),

    (20, "Evolve Your Style", "STYLE",
     "Three weeks in, your outer world should be aligning with your inner transformation. "
     "Today we refine your personal style and make bold, intentional choices.",
     ["Invest in one quality wardrobe piece (not fast fashion): a blazer, silk shirt, or great denim.",
      "Learn one new way to style your hair — a sleek bun, waves, or a braid.",
      "Research how to dress for your body shape and colour season (warm/cool undertones).",
      "Elevate your everyday — even casual days deserve one intentional touch: earrings, a belt, a scarf.",
      "Wear something bold you've been saving for a 'special occasion.' Today is that occasion."],
     "When I imagine the most stylish version of me — what does she wear and how does she carry herself?",
     "My style is an expression of my soul, and she deserves to be dressed beautifully."),

    (21, "Week 3 Reflection", "MIND",
     "Three weeks in. This is the point where many people give up — because the initial "
     "excitement has faded and the real work has begun. But you're still here.",
     ["Review your vision board — are your daily actions aligned with your vision?",
      "Write 3 moments from this week where you truly showed up for yourself.",
      "What habits are now automatic? What still requires deliberate effort?",
      "List 3 things you will do differently in your final week.",
      "Message or call one person who is on their own growth journey and share progress."],
     "Who am I becoming, and what does she need from me in these final 9 days?",
     "I have come too far to go back. My glow up is real and it is happening."),

    (22, "Mental Health First", "MIND",
     "Your mental health is the soil in which your glow grows. Without tending it, no "
     "skincare routine or gym plan will produce the radiance you're after.",
     ["Research one therapy option or mental health resource in your area or online.",
      "Practice a full 15-minute guided meditation (YouTube or a dedicated app).",
      "Journal about any anxiety, fear, or heaviness that's been sitting with you. Release it.",
      "Take a 30-minute walk in nature with no headphones — just you and your thoughts.",
      "Practice the 5-4-3-2-1 grounding technique whenever you feel overwhelmed today."],
     "What emotions have I been avoiding, and what would happen if I finally faced them?",
     "My mental health is my priority. I choose peace, healing, and clarity."),

    (23, "Glamour Day", "SKIN",
     "Treat yourself like the high-value woman you are becoming. Today is about luxury, "
     "indulgence, and self-celebration — because you have earned it.",
     ["Book or DIY a facial, massage, manicure, or pedicure.",
      "Take a long, luxurious bath with oils, salts, candles, and music.",
      "Exfoliate your full body and apply rich moisturiser from neck to toe.",
      "Do your full hair and makeup (or full skincare glow routine) — just for you.",
      "Eat your favourite nourishing meal. Set a beautiful table for yourself. You are worth it."],
     "Do I truly believe I deserve to be pampered and celebrated? Why or why not?",
     "I deserve luxury, softness, and beauty in every corner of my life."),

    (24, "Money Moves", "MIND",
     "A financially secure woman glows differently. Today, we take your financial empowerment "
     "to the next level with intentional, bigger-picture thinking.",
     ["Research one new income stream: freelancing, reselling, content creation, or investing.",
      "Open a dedicated savings account for your goals if you don't have one.",
      "Spend 30 minutes learning about compound interest, index funds, or investing basics.",
      "Unsubscribe from three subscriptions you don't actively use.",
      "Set a savings target for the next 3 months. Write it down and put it somewhere visible."],
     "What would financial freedom feel like — and what is one step I can take today?",
     "Money flows to me easily. I am building wealth and security with intention."),

    (25, "Master Your Rituals", "SOUL",
     "By now your routines are forming. Today we make them non-negotiable. Your morning "
     "and evening rituals are your two most powerful windows for daily transformation.",
     ["Write your ideal morning routine (15–60 minutes) and commit to it for these final days.",
      "Write your ideal evening routine — wind down, skincare, reflection, screens off by 9pm.",
      "Prepare for tomorrow tonight: lay out clothes, prep food, write your priority list.",
      "Practice gratitude before bed: 3 things you're grateful for + 3 wins from today.",
      "Set your alarm 10 minutes earlier than you need — never start your day in a panic."],
     "What does my ideal day look like, and how close am I to actually living it?",
     "I own my mornings. I honour my evenings. I create my life with intention."),

    (26, "Your Authentic Voice", "SOUL",
     "Part of glowing up is standing fully in your truth — knowing what you believe and "
     "value, and expressing it without apology.",
     ["Write your personal values — the top 5 things that are non-negotiable in your life.",
      "Share something real and honest today: in a conversation, a post, or your journal.",
      "Practice saying what you mean — not just what you think people want to hear.",
      "Create something today: write, cook, paint, make music, style an outfit. Just create.",
      "Spend 20 minutes on a hobby that's purely for your joy — no productivity, no hustle."],
     "Where have I been silencing myself, and what would it feel like to fully speak up?",
     "My voice matters. My truth matters. I show up as my full, authentic self."),

    (27, "Body Love", "BODY",
     "Real glow ups aren't about shrinking or fixing — they're about coming home to your "
     "body with love, respect, and deep gratitude for everything it does.",
     ["Write a love letter to your body — thanking it for every way it serves you.",
      "Move in a way that feels joyful, not punishing: dance, swim, walk, freely stretch.",
      "For 24 hours, ban any critical words about your appearance — in your head or out loud.",
      "Prepare the most beautiful, colourful, vibrant meal you can and eat it mindfully.",
      "Stand in the mirror and say: 'I love you. You are enough. You are beautiful.'"],
     "What would change if I truly, deeply loved my body exactly as it is right now?",
     "I am grateful for this body. I love every inch of it, and I treat it like a treasure."),

    (28, "Level Up Your Skills", "MIND",
     "The most magnetic women are always growing. A commitment to lifelong learning is one "
     "of the most attractive and powerful qualities you can cultivate.",
     ["Sign up for a course, class, or workshop in something that genuinely excites you.",
      "Read for 30 minutes on a topic that challenges or expands your thinking.",
      "Learn one new practical skill: a recipe, a language phrase, a design technique.",
      "Update your CV or LinkedIn — you've grown this month, and the record should reflect it.",
      "Teach something to someone else — teaching is the fastest way to deepen mastery."],
     "What skills, knowledge, or gifts do I have that I haven't yet shared with the world?",
     "I am always learning, always growing, and always becoming more."),

    (29, "Celebrate Yourself", "SOUL",
     "Tomorrow is your final day. Today, you stop and truly celebrate. The woman you are "
     "right now is not the same woman who started 29 days ago.",
     ["Take a Day 29 photo. Compare it to your Day 1 photo. Celebrate the difference.",
      "Read back through your journal entries from this month — how have you changed?",
      "List 29 wins from this journey — one for each day, big or small.",
      "Buy yourself a gift: a book, a plant, a piece of jewellery, a beautiful candle.",
      "Tell someone you trust about your journey and how you've changed."],
     "Looking back at the woman I was on Day 1 — what would I tell her?",
     "I have done the work. I have shown up. I have glowed, and I am only beginning."),

    (30, "She's Here", "SOUL",
     "Day 30. She's here. You're here. Not perfect — but present, powerful, and profoundly "
     "more aligned with the woman you were always meant to be. This is not the end. "
     "This is the beginning of a woman who now knows exactly what she is capable of.",
     ["Write a 'Glow Up Graduation Letter' — your journey, your growth, your future.",
      "Review all five pillars: what are your new, permanent habits in each one?",
      "Set 3 ambitious goals for the next 30 days to continue your momentum.",
      "Share your story if you feel called to — your transformation could inspire another woman.",
      "Do your full morning ritual today: hydrate, move, journal, nourish, affirm.",
      "Look in the mirror. Say her name. She is you. She was always you."],
     "Who am I now — and what is she truly capable of?",
     "I am glowing. I am growing. I am her. And she is magnificent."),
]

WEEK_TITLES = {
    1: "WEEK 1 — Foundation: Mind, Habits & Skin",
    2: "WEEK 2 — Body, Fitness & Nutrition",
    3: "WEEK 3 — Style, Confidence & Social Energy",
    4: "WEEK 4 — Soul, Purpose & Radiance",
}

WEEK_SUMMARIES = {
    1: ["Day 1: Declare Your Glow Up", "Day 2: Skincare Reset", "Day 3: Move Your Body",
        "Day 4: Closet Detox", "Day 5: Nourish From Within",
        "Day 6: Morning Ritual", "Day 7: Week 1 Reflection"],
    2: ["Day 8: Build Your Fitness Plan", "Day 9: Hair Glow Up", "Day 10: Digital Detox",
        "Day 11: Posture & Presence", "Day 12: Financial Glow Up",
        "Day 13: Feminine Energy Day", "Day 14: Week 2 Reflection"],
    3: ["Day 15: Confidence Overhaul", "Day 16: Advanced Skincare",
        "Day 17: Build Your Vision", "Day 18: Relationship Audit",
        "Day 19: Push Your Fitness", "Day 20: Evolve Your Style",
        "Day 21: Week 3 Reflection"],
    4: ["Day 22: Mental Health First", "Day 23: Glamour Day", "Day 24: Money Moves",
        "Day 25: Master Your Rituals", "Day 26: Your Authentic Voice",
        "Day 27: Body Love", "Day 28: Level Up Skills",
        "Day 29: Celebrate Yourself", "Day 30: She's Here"],
}


def build():
    path = '/home/user/Claude1/30_Day_Glow_Up_Guide.pdf'
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
    )
    S = styles()
    story = []
    uw = PAGE_W - 5*cm  # usable width

    # Cover: just a page break — cover art drawn entirely by the first_page callback
    story.append(PageBreak())

    # Table of Contents
    story.append(Paragraph('Table of Contents', S['intro']))
    story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=12))
    toc = [
        ('Introduction', 'Your Glow Up Journey Begins'),
        ('Week 1 — Days 1–7', 'Foundation: Mind, Habits & Skin'),
        ('Week 2 — Days 8–14', 'Body, Fitness & Nutrition'),
        ('Week 3 — Days 15–21', 'Style, Confidence & Social Energy'),
        ('Week 4 — Days 22–30', 'Soul, Purpose & Radiance'),
        ('Bonus Section', 'Affirmations, Resources & Habit Tracker'),
    ]
    for ch, desc in toc:
        story.append(Paragraph(f'<b>{ch}</b>', S['toc_ch']))
        story.append(Paragraph(desc, S['toc_e']))
    story.append(PageBreak())

    # Introduction
    story.append(Paragraph('Introduction', S['ch']))
    story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=10))
    intro_sections = [
        ("What Does 'Glow Up' Really Mean?",
         "A glow up is not just a physical transformation — it's a complete evolution of how you look, "
         "feel, think, and carry yourself in the world. It's the version of you that walks into a room "
         "and turns heads — not because she's perfect, but because of the energy she radiates. "
         "This 30-day guide is your roadmap to becoming that woman."),
        ("Who This Guide Is For",
         "This guide is for every woman who is tired of waiting for 'someday.' Whether you're emerging "
         "from a hard season, a breakup, burnout, or simply feel like you've lost yourself — this is "
         "your reset. No crash diets, no overnight miracles. Just 30 days of intentional, consistent "
         "action across five pillars: Mind, Body, Skin, Style, and Soul."),
        ("How to Use This Guide",
         "Each day includes a theme, a core intention, specific action steps, an evening reflection "
         "prompt, and a daily affirmation. You don't have to be perfect — you just have to show up. "
         "Bookmark favourite days, repeat weeks that felt transformative, and remember: the goal is "
         "progress, not perfection. One day at a time builds the life of a lifetime."),
        ("The Five Pillars of Your Glow Up",
         "MIND: Your mindset, thoughts, beliefs, and mental clarity.  "
         "BODY: Movement, nutrition, sleep, and physical health.  "
         "SKIN: Skincare, hydration, glow, and self-care rituals.  "
         "STYLE: Your wardrobe, presentation, and personal aesthetic.  "
         "SOUL: Purpose, joy, boundaries, and authentic self-expression."),
    ]
    for title, body in intro_sections:
        story.append(Paragraph(title, S['sec']))
        story.append(Paragraph(body, S['body']))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        '"She made the decision to be better — and that decision changed everything."',
        S['quote']))
    story.append(PageBreak())

    # 30 Days
    for day_num, title, pillar, body_text, actions, reflection, affirmation in DAYS:
        week = (day_num - 1) // 7 + 1
        if day_num in (1, 8, 15, 22):
            story.append(Paragraph(WEEK_TITLES[week], S['ch']))
            story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=10))
            story.append(Paragraph(
                f'This week covers {len(WEEK_SUMMARIES[week])} powerful days of intentional growth:',
                S['body']))
            for entry in WEEK_SUMMARIES[week]:
                story.append(Paragraph(f'• {entry}', S['bullet']))
            story.append(PageBreak())

        story.append(DayBox(day_num, title, uw))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f'Pillar: {pillar}', S['day_focus']))
        story.append(Paragraph(body_text, S['body']))
        story.append(Paragraph("Today's Action Steps", S['sec']))
        for action in actions:
            story.append(Paragraph(f'✦  {action}', S['bullet']))
        story.append(Spacer(1, 8))
        story.append(Paragraph('Evening Reflection', S['sec']))
        story.append(Paragraph(reflection, S['body']))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f'"{affirmation}"', S['quote']))
        story.append(HRFlowable(width='80%', thickness=1, color=LIGHT_PINK, spaceAfter=6))
        story.append(PageBreak())

    # Bonus: Affirmations
    story.append(Paragraph('Bonus: Your Glow Up Toolkit', S['ch']))
    story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=10))
    story.append(Paragraph('Master Affirmations List', S['sec']))
    affirmations = [
        "I am becoming the most powerful and radiant version of myself.",
        "I deserve love, abundance, and everything I desire.",
        "My consistency creates miracles.",
        "I am magnetic, confident, and unforgettable.",
        "I invest in myself daily because I am worth it.",
        "My glow comes from within and lights up every room I enter.",
        "I release everything that no longer serves the woman I'm becoming.",
        "I am disciplined, focused, and deeply intentional.",
        "Beauty, grace, and strength are my birthright.",
        "Every day I choose growth over comfort — and it changes everything.",
    ]
    for a in affirmations:
        story.append(Paragraph(f'✦  {a}', S['bullet']))

    story.append(Spacer(1, 14))
    story.append(Paragraph('Recommended Resources', S['sec']))
    resources = [
        ("Books to Read",
         ["The Power of Now — Eckhart Tolle (mindset & presence)",
          "You Are a Badass — Jen Sincero (confidence & self-worth)",
          "Atomic Habits — James Clear (habit building)",
          "The Body Is Not An Apology — Sonya Renee Taylor (body love)",
          "Rich Dad Poor Dad — Robert Kiyosaki (financial education)"]),
        ("Skincare Ingredients to Know",
         ["Vitamin C — brightening, antioxidant protection (AM)",
          "Retinol — anti-ageing, cell turnover (PM only)",
          "Niacinamide — pore-minimising, oil control",
          "Hyaluronic Acid — deep hydration",
          "SPF 30+ — the single most anti-ageing product that exists"]),
        ("Apps & Tools",
         ["Headspace or Calm — guided meditation",
          "MyFitnessPal — nutrition and macro tracking",
          "Pinterest — style mood boarding and vision boards",
          "Notion or Day One — journaling and goal tracking",
          "Duolingo — learning a new language (invest in your mind)"]),
    ]
    for cat, items in resources:
        story.append(Paragraph(cat, S['day_focus']))
        for item in items:
            story.append(Paragraph(f'• {item}', S['bullet']))
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # Habit Tracker
    story.append(Paragraph('30-Day Habit Tracker', S['ch']))
    story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=10))
    story.append(Paragraph(
        'Print this page and tick off each habit daily. Small ticks build massive transformation.',
        S['body']))
    story.append(Spacer(1, 10))

    habits = [
        'Drank 2.5L water',
        'Skincare AM + PM',
        'Moved my body',
        'Ate nourishing food',
        'No scroll first 30 min',
        'Journaled / reflected',
        'Said my affirmations',
        'Slept 7–9 hours',
        'Did something for my soul',
        'Showed up with confidence',
    ]
    cw = [118] + [14] * 15

    for start, end in [(1, 16), (16, 31)]:
        hrow = ['Habit'] + [str(i) for i in range(start, end)]
        data = [hrow] + [[h] + ['☐'] * 15 for h in habits]
        tbl = Table(data, colWidths=cw)
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), DEEP_PUR),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.3, LIGHT_PINK),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BLUSH]),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 14))

    story.append(PageBreak())

    # Closing
    story.append(Spacer(1, 40))
    story.append(Paragraph('A Final Word', S['ch']))
    story.append(HRFlowable(width='100%', thickness=2, color=PINK, spaceAfter=14))
    story.append(Paragraph(
        "You didn't just complete a 30-day challenge. You proved to yourself that you are the kind "
        "of woman who does what she says she's going to do. That is the real glow up — the one that "
        "lives inside you, unshakeable, earned, and entirely yours.", S['body']))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "The world is brighter with you glowing in it. Keep going.", S['body']))
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        '"She remembered who she was — and the game changed."', S['quote']))

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(f'Saved: {path}')


if __name__ == '__main__':
    build()
