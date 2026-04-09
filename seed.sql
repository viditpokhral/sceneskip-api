-- ============================================================
-- SceneSkip seed data — run after schema.sql
-- ============================================================

insert into timestamps (id, keyword, start_time, end_time, category, title) values

-- Game of Thrones S1E1 (manually verified)
('got-s1e1-1',  'game of thrones s1e1', 1830, 1875, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-2',  'game of thrones s1e1', 1890, 1915, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-3',  'game of thrones s1e1', 1930, 1945, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-4',  'game of thrones s1e1', 2060, 2140, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-5',  'game of thrones s1e1', 2350, 2360, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-6',  'game of thrones s1e1', 3050, 3060, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-7',  'game of thrones s1e1', 3075, 3100, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-8',  'game of thrones s1e1', 3130, 3135, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-9',  'game of thrones s1e1', 3250, 3270, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-10', 'game of thrones s1e1', 3415, 3440, 'nudity',   'Game of Thrones S1E1'),
('got-s1e1-11', 'game of thrones s1e1', 3565, 3590, 'nudity',   'Game of Thrones S1E1'),

-- Lucifer S1E1 (approximate, needs manual verification)
('luc-s1e1-1',  'lucifer s1e1',          45,   90,  'nudity',   'Lucifer S1E1'),
('luc-s1e1-2',  'lucifer s1e1',         118,  145,  'nudity',   'Lucifer S1E1'),
('luc-s1e1-3',  'lucifer s1e1',         310,  328,  'violence', 'Lucifer S1E1'),
('luc-s1e1-4',  'lucifer s1e1',         335,  350,  'gore',     'Lucifer S1E1'),
('luc-s1e1-5',  'lucifer s1e1',         370,  385,  'violence', 'Lucifer S1E1'),
('luc-s1e1-6',  'lucifer s1e1',         780,  800,  'gore',     'Lucifer S1E1'),
('luc-s1e1-7',  'lucifer s1e1',        1050, 1075,  'nudity',   'Lucifer S1E1'),
('luc-s1e1-8',  'lucifer s1e1',        1620, 1645,  'violence', 'Lucifer S1E1'),
('luc-s1e1-9',  'lucifer s1e1',        2180, 2210,  'violence', 'Lucifer S1E1'),
('luc-s1e1-10', 'lucifer s1e1',        2290, 2315,  'violence', 'Lucifer S1E1')

on conflict (id) do nothing;
