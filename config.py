import os

class Config(object):
  SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
  FACEBOOK_CLIENT_ID = "2769812323343725"
  FACEBOOK_CLIENT_SECRET = "a171f32eb1b516ead5cafe3278594d9f"
